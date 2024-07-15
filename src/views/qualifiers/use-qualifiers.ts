import { useLocalStorage } from '@vueuse/core'

export interface QualifiersSettings {
  background?: string
  title?: string
  subTitle?: string
}

export interface Qualifier {
  id: string
  countryCode?: string
  names: string[]
}

const settings = useLocalStorage<QualifiersSettings>('rs-qualifiers-settings', {})
const qualifiers = useLocalStorage<Qualifier[]>('rs-qualifiers', [])

export function useQualifiers () {
  return {
    settings,
    qualifiers
  }
}
