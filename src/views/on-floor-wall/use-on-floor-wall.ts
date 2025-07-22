import { useLocalStorage } from '@vueuse/core'
import type { ServoCurrentHeatInfoConfig } from '../../hooks/heat-info'

export interface OnFloorWallSettings {
  heatInfo?: ServoCurrentHeatInfoConfig
  background?: string
  showFlags?: boolean
  mode?: typeof onFloorWallNameModes[number]['value']
}

export const onFloorWallNameModes = [
  { text: 'Athlete Names', value: 'athlete-names' },
  { text: 'Team Name', value: 'team-name' },
  { text: 'Athletes and Team Name', value: 'athletes-and-team-name' },
] as const

const settings = useLocalStorage<OnFloorWallSettings>('rs-on-floor-wall-settings', {})

export function useOnFloorWallSettings () {
  return settings
}
