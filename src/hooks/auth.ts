import { provideApolloClient } from '@vue/apollo-composable'
import { MaybeRef, useLocalStorage } from '@vueuse/core'
import { watch, computed, unref } from 'vue'
import { apolloClient } from '../apollo'
import { useMeQuery, useRegisterUserMutation, useUpdateUserMutation } from '../graphql/generated'

export function useAuth () {
  provideApolloClient(apolloClient)
  const { loading, refetch, result } = useMeQuery({})
  const token = useLocalStorage<null | string>('rs-auth', null)
  const registerMutation = useRegisterUserMutation()
  const updateMutation = useUpdateUserMutation()

  watch(token, (nT, pT) => {
    console.log('token', nT)
    if (pT === null && nT !== null) return refetch()
  })

  async function register ({ name }: { name: MaybeRef<string> }) {
    const res = await registerMutation.mutate({ name: unref(name) })
    if (res?.data?.registerUser) {
      token.value = res.data.registerUser
      await apolloClient.resetStore()
    }
  }

  async function update ({ name }: { name: MaybeRef<string> }) {
    await updateMutation.mutate({ name: unref(name) })
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
    update,
    logOut
  }
}
