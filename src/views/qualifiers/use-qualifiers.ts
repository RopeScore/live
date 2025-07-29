import { useLocalStorage } from '@vueuse/core'

export interface QualifiersSettings {
  background?: string
}

export interface QualifierSession {
  id: string
  title?: string
  subTitle?: string
  qualifiers: Qualifier[]
}

export interface Qualifier {
  id: string
  countryCode?: string
  names: string[]
  showBlink?: boolean
  blinkText?: string
}

const settings = useLocalStorage<QualifiersSettings>('rs-qualifiers-settings', {})
const sessions = useLocalStorage<QualifierSession[]>('rs-qualifier-sessions', [])

export function useQualifiers () {
  return {
    settings,
    sessions
  }
}
