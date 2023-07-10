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

export interface DeviceStreamSettings {
  poolBackgrounds?: ServoPoolBackgroundsConfig
}

const pools = useLocalStorage<StreamPool[]>('rs-device-stream-pools', [])
const settings = useLocalStorage<DeviceStreamSettings>('rs-device-stream-settings', {})

export function useDeviceStreamPools () {
  return {
    pools,
    settings
  }
}
