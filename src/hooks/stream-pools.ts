import { useLocalStorage } from '@vueuse/core'

interface StreamPool {
  deviceId?: string
  label?: number
}

const pools = useLocalStorage<StreamPool[]>('rs-stream-pools', [])

export function useStreamPools () {
  return pools
}
