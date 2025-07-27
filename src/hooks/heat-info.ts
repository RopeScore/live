import { computed, type Ref, ref, watch } from 'vue'
import { useFetch, useTimeoutPoll } from '@vueuse/core'
import { useGroupInfoQuery, useHeatChangedSubscription, useHeatEntriesScoresheetsQuery, useScoresheetChangedSubscription, type MarkScoresheetFragment, type ScoresheetBaseFragment } from '../graphql/generated'
import { filterLatestScoresheets, type CompetitionEvent } from '../helpers'

export interface ServoCurrentHeatInfoConfig {
  system: 'servo'
  baseUrl: string
  competitionId?: number
}

interface NoHeatSystemConfig {
  system: 'none'
}

interface RopeScoreCurrentHeatInfoConfig {
  system: 'ropescore'
  groupId?: string
}

export type HeatInfoConfig = ServoCurrentHeatInfoConfig | RopeScoreCurrentHeatInfoConfig | NoHeatSystemConfig

export interface ServoHeatInfo {
  PROGRAM: 'ON' | ''
  Station: number
  HeatNumber: string
  Event: string
  DivisionName: string
  AgeGroupName: string
  GenderName: string
  GroupName: string
  Team: string
  TeamCountryCode: string | null
  TeamCountryName: string
  TeamCountryFlagUrl: string
  EntryNumber: number
  CompEventEntryID: string
  LiveScoringAssignmentCode: string
  [nameKey: `Part${number}`]: string
  [lastNameKey: `Part${number}_Last`]: string
}

export interface HeatInfo {
  poolLabel: string
  bgUrl?: string
  names?: string[]
  teamName?: string
  delegationName?: string
  didNotSkip?: boolean
  submitted?: boolean

  deviceId?: string
  judgeType?: string | null
  competitionEventId?: CompetitionEvent
  entryId?: string
  rsScoresheetId?: string
  servoAssignmentCode?: string

  _servo?: ServoHeatInfo
}

export interface UseHeatInfoReturn {
  currentHeat: Ref<string | number | undefined>
  pools: Ref<Record<string, HeatInfo>>
}

export function useHeatInfo (settings: Ref<HeatInfoConfig | undefined>): UseHeatInfoReturn {
  // SERVO
  const servoPollUrl = ref<string>('')

  const servoCurrentHeatFetch = useFetch(servoPollUrl, {
    headers: {
      accept: 'application/json'
    }
  }, {
    immediate: false
  }).get().json<ServoHeatInfo[]>()

  const servoPoll = useTimeoutPoll(() => {
    void servoCurrentHeatFetch.execute()
  }, 5_000, { immediate: false, immediateCallback: true })

  // ROPESCORE
  const groupIdVars = computed(() => settings.value?.system === 'ropescore' ? { groupId: settings.value.groupId ?? '' } : { groupId: '' })
  const rsEnabled = computed(() => settings.value?.system === 'ropescore')
  const groupInfo = useGroupInfoQuery(groupIdVars, {
    enabled: rsEnabled,
  })
  const heatChangeSubscription = useHeatChangedSubscription(groupIdVars, {
    enabled: rsEnabled,
  })

  const currentHeat = ref(1)
  watch(groupInfo.result, result => {
    if (typeof result?.group?.currentHeat === 'number') currentHeat.value = result?.group?.currentHeat
  })
  watch(heatChangeSubscription.result, result => {
    if (typeof result?.heatChanged === 'number') currentHeat.value = result?.heatChanged
  })

  const entriesQuery = useHeatEntriesScoresheetsQuery(computed(() => ({
    ...groupIdVars.value,
    heat: currentHeat.value
  })), {
    pollInterval: 15_000,
    fetchPolicy: 'cache-and-network',
    enabled: rsEnabled,
  })

  const scoresheetChangedSubscription = useScoresheetChangedSubscription(computed(() => ({
    entryIds: entriesQuery.result.value?.group?.entriesByHeat.map(e => e.id) ?? []
  })), {
    enabled: rsEnabled
  })
  watch(scoresheetChangedSubscription.result, () => {
    void entriesQuery.refetch()
  })

  // GENERAL
  watch(() => settings.value, heatInfoConfig => {
    // start by just disabling all polling
    servoPoll.pause()

    if (heatInfoConfig?.system === 'servo' && heatInfoConfig.competitionId != null) {
      let url
      try {
        url = new URL(`/api/v1/competitions/${heatInfoConfig.competitionId}/info/current`, heatInfoConfig.baseUrl)
      } catch {
        return
      }
      servoPollUrl.value = url.href
      servoPoll.resume()
    }
  }, { immediate: true })

  return {
    currentHeat: computed(() => {
      if (settings.value?.system === 'servo') return servoCurrentHeatFetch.data.value?.[0].HeatNumber
      else if (settings.value?.system === 'ropescore') return currentHeat.value
      else return undefined
    }),
    pools: computed(() => {
      if (settings.value?.system === 'servo') {
        return Object.fromEntries(servoCurrentHeatFetch.data.value?.map(hi => [
          `${hi.Station}`,
          {
            poolLabel: `${hi.Station}`,
            bgUrl: hi.TeamCountryFlagUrl || (hi.TeamCountryCode ? `/flags/${hi.TeamCountryCode.toLocaleLowerCase()}.svg` : undefined),
            names: getServoHeatNameList(hi, { mode: 'first' }),
            teamName: hi.GroupName || undefined,
            delegationName: hi.Team,
            entryId: `${hi.EntryNumber}`,
            servoAssignmentCode: hi.LiveScoringAssignmentCode,

            _servo: hi,
          } as HeatInfo
        ]) ?? [])
      } else if (settings.value?.system === 'ropescore') {
        return Object.fromEntries(entriesQuery.result.value?.group?.entriesByHeat?.map(entry => {
          const scoresheet = filterLatestScoresheets(entry.scoresheets)
            .find(scsh => scsh.__typename === 'MarkScoresheet' && scsh.options?.live === true) as (MarkScoresheetFragment & ScoresheetBaseFragment) | undefined

          return [
            `${entry.pool ?? ''}`,
            {
              poolLabel: `${entry.pool ?? ''}`,
              names: entry.participant.__typename === 'Team' ? entry.participant.members.map(name => guessFirstName(name)) : [entry.participant.name],
              teamName: entry.participant.__typename === 'Team' ? entry.participant.name : undefined,
              delegationName: entry.participant.club,
              bgUrl: entry.participant.country ? `/flags/${entry.participant.country.toLocaleLowerCase()}.svg` : undefined,
              didNotSkip: entry.didNotSkipAt != null,
              submitted: scoresheet?.completedAt != null,
              competitionEventId: entry.competitionEventId,
              judgeType: scoresheet?.judgeType,
              entryId: entry.id,

              rsScoresheetId: scoresheet?.id,
            } as HeatInfo
          ]
        }) ?? [])
      } else {
        return {}
      }
    })
  }
}

interface GetServoHeatNameListOptions {
  /** @default 'full' */
  mode?: 'full' | 'last' | 'first'
}
export function getServoHeatNameList (heat: ServoHeatInfo, { mode = 'full' }: GetServoHeatNameListOptions = {}) {
  const names: string[] = []
  for (let idx = 1; idx <= 5; idx++) {
    switch (mode) {
      case 'first': {
        let name = heat[`Part${idx}`] ?? ''
        name = name.substring(0, name.length - (heat[`Part${idx}_Last`] ?? '').length).trim()
        if (name.length > 0) names.push(name)
        break
      }
      case 'last': {
        const name = heat[`Part${idx}_Last`]?.trim() ?? ''
        if (name.length > 0) names.push(name)
        break
      }
      default: {
        const name = heat[`Part${idx}`]?.trim() ?? ''
        if (name.length > 0) names.push(name)
      }
    }
  }
  return names
}

export function guessFirstName (name: string) {
  return name.trim().split(/\s+/)[0] ?? name ?? ''
}
