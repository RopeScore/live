import { useLocalStorage } from '@vueuse/core'

export interface StreamPool {
  deviceId?: string
  label?: number
}

export interface ServoPoolBackgroundsConfig {
  system: 'servo'
  baseUrl: string
  competitionId?: number
}

export interface ScreenConfig {
  rows: number
  cols: number
  // row:col
  pools?: Record<`${number}:${number}`, StreamPool>
}

export interface DeviceStreamSettings {
  poolBackgrounds?: ServoPoolBackgroundsConfig
  screens?: Record<string, ScreenConfig>
}

const settings = useLocalStorage<DeviceStreamSettings>('rs-device-stream-settings', {})

export function useDeviceStreamPools () {
  return settings
}
