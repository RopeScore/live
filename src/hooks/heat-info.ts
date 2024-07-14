import { type Ref, ref, watch } from 'vue'
import { useFetch, useTimeoutPoll } from '@vueuse/core'
import type { ServoCurrentHeatInfoConfig } from './stream-pools'

export interface ServoHeatPoolInfo {
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
  }).get().json<ServoHeatPoolInfo[]>()

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
