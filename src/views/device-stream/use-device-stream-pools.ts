import { useLocalStorage } from '@vueuse/core'
import type { HeatInfoConfig } from '../../hooks/heat-info'

export interface StreamPool {
  deviceId?: string
  label?: number
}

export interface ScreenConfig {
  rows: number
  cols: number
  // row:col
  pools?: Record<`${number}:${number}`, StreamPool>
  hideClock?: boolean
  hideCurrentHeat?: boolean
}

export interface DeviceStreamSettings {
  heatInfo?: HeatInfoConfig
  screens?: Record<string, ScreenConfig>
}

export const HEAT_SYSTEMS = ['servo', 'ropescore', 'none'] as const
export type HeatSystem = typeof HEAT_SYSTEMS[number]

const settings = useLocalStorage<DeviceStreamSettings>('rs-device-stream-settings', {})

export function useDeviceStreamPools () {
  return settings
}
