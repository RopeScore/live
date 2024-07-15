import { useLocalStorage } from '@vueuse/core'
import type { ServoCurrentHeatInfoConfig } from '../../hooks/heat-info'

export interface StreamPool {
  deviceId?: string
  label?: number
}

export interface ScreenConfig {
  rows: number
  cols: number
  // row:col
  pools?: Record<`${number}:${number}`, StreamPool>
}

export interface DeviceStreamSettings {
  heatInfo?: ServoCurrentHeatInfoConfig
  screens?: Record<string, ScreenConfig>
}

const settings = useLocalStorage<DeviceStreamSettings>('rs-device-stream-settings', {})

export function useDeviceStreamPools () {
  return settings
}
