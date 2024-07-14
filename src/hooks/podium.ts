import { useLocalStorage } from '@vueuse/core'

export interface PodiumSettings {
  background?: string
  withTitle?: boolean
  title?: string
}

const settings = useLocalStorage<PodiumSettings>('rs-podium-settings', {})
const podium = useLocalStorage<Record<'1st' | '2nd' | '3rd', string[]>>('rs-podium', { '1st': [], '2nd': [], '3rd': [] })

export function usePodium () {
  return {
    settings,
    podium
  }
}
