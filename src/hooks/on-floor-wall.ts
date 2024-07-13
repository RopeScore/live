import { useLocalStorage } from '@vueuse/core'
import type { ServoCurrentHeatInfoConfig } from './stream-pools'

export interface OnFloorWallSettings {
  heatInfo?: ServoCurrentHeatInfoConfig
  background?: string
}

const settings = useLocalStorage<OnFloorWallSettings>('rs-on-floor-wall-settings', {})

export function useOnFloorWallSettings () {
  return settings
}
