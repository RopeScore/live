import { type Ref, ref, watch } from 'vue'
import { useFetch, useTimeoutPoll } from '@vueuse/core'
export interface ServoCurrentHeatInfoConfig {
  system: 'servo'
  baseUrl: string
  competitionId?: number
}

export interface ServoHeatInfo {
  PROGRAM: 'ON' | ''
  Station: number
  HeatNumber: string
  Event: string
  DivisionName: string
  AgeGroupName: string
  GenderName: string
  Team: string
  TeamCountryCode: string
  TeamCountryName: string
  TeamCountryFlagUrl: string
  EntryNumber: number
  CompEventEntryID: string
  [nameKey: `Part${number}`]: string
  [lastNameKey: `Part${number}_Last`]: string
}

export function useHeatInfo (settings: Ref<ServoCurrentHeatInfoConfig | undefined>) {
  const servoPollUrl = ref<string>('')

  const servoCurrentHeatFetch = useFetch(servoPollUrl, {
    headers: {
      accept: 'application/json'
    }
  }, {
    immediate: false
  }).get().json<ServoHeatInfo[]>()

  const servoPoll = useTimeoutPoll(() => {
    servoCurrentHeatFetch.execute()
  }, 5_000, { immediate: false })

  watch(() => settings.value, heatInfoConfig => {
    // start by just disabling all polling
    servoPoll.pause()

    if (heatInfoConfig?.system === 'servo' && heatInfoConfig.competitionId != null) {
      let url
      try {
        url = new URL(`/api/v1/competitions/${heatInfoConfig.competitionId}/info/current`, heatInfoConfig.baseUrl as string)
      } catch {
        return
      }
      servoPollUrl.value = url.href
      servoPoll.resume()
    }
  }, { immediate: true })

  return servoCurrentHeatFetch
}

interface GetHeatNameListOptions {
  /** @default 'full' */
  mode?: 'full' | 'last' | 'first'
}
export function getHeatNameList (heat: ServoHeatInfo, { mode = 'full' }: GetHeatNameListOptions = {}) {
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
      }
      default: {
        const name = heat[`Part${idx}`]?.trim() ?? ''
        if (name.length > 0) names.push(name)
      }
    }
  }
  return names
}
