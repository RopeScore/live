import { provideApolloClient } from '@vue/apollo-composable'
import { MaybeRef, useLocalStorage } from '@vueuse/core'
import { watch, computed } from 'vue'
import { apolloClient } from '../apollo'
import { useMeQuery, useRegisterUserMutation } from '../graphql/generated'

export function useAuth () {
  provideApolloClient(apolloClient)
  const { loading, refetch, result } = useMeQuery({})
  const token = useLocalStorage<null | string>('rs-auth', null)
  const mutation = useRegisterUserMutation()

  watch(token, (nT, pT) => {
    console.log('token', nT)
    if (pT === null && nT !== null) return refetch()
  })

  async function register ({ name }: { name: MaybeRef<string> }) {
    const res = await mutation.mutate()
    if (res?.data?.registerUser) {
      token.value = res.data.registerUser
      await apolloClient.resetStore()
    }
  }

  async function logOut () {
    token.value = null
    await apolloClient.resetStore()
  }

  const user = computed(() => result.value?.me)
  const isLoggedIn = computed(() => !!result.value?.me)

  return {
    token,
    loading,
    user,
    isLoggedIn,

    register,
    logOut
  }
}
