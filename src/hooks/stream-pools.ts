import { useLocalStorage } from '@vueuse/core'

interface StreamPool {
  deviceId?: string
  label?: number
}

interface ServoPoolBackgroundsConfig {
  system: 'servo'
  baseUrl: string
  competitionId?: number
}

interface DeviceStreamSettings {
  poolBackgrounds?: ServoPoolBackgroundsConfig | null
}

const pools = useLocalStorage<StreamPool[]>('rs-device-stream-pools', [])
const settings = useLocalStorage<DeviceStreamSettings>('rs-device-stream-settings', {})

export function useDeviceStreamPools () {
  return {
    pools,
    settings
  }
}
