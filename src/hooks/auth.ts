import { useLocalStorage } from '@vueuse/core'

export function useAuth () {
  const token = useLocalStorage<null | string>('rs-auth', null)
  return {
    token
  }
}
