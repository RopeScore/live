import { useLocalStorage } from '@vueuse/core'

interface StreamPool {
  deviceId?: string
}

const pools = useLocalStorage<StreamPool[]>('rs-stream-pools', [])

export function useStreamPools () {
  return pools
}
