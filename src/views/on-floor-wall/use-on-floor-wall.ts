import { useLocalStorage } from '@vueuse/core'
import type { ServoCurrentHeatInfoConfig } from '../../hooks/heat-info'

export interface OnFloorWallSettings {
  heatInfo?: ServoCurrentHeatInfoConfig
  background?: string
  showFlags?: boolean
}

const settings = useLocalStorage<OnFloorWallSettings>('rs-on-floor-wall-settings', {})

export function useOnFloorWallSettings () {
  return settings
}
