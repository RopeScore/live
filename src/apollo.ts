import { ApolloClient, createHttpLink, InMemoryCache, split } from '@apollo/client/core'
import { getMainDefinition } from '@apollo/client/utilities'
import { setContext } from '@apollo/client/link/context'
import { useAuth } from './hooks/auth'
import { WebSocketLink } from './graphql-ws'
import { watch, computed } from 'vue'
import { useFetch, useIntervalFn, useLocalStorage } from '@vueuse/core'

const localDiscover = useFetch('http://ropescore.local').get().text()
const resolvedReachable = useFetch(
  computed(() => `https://${localDiscover.data.value}/.well-known/apollo/server-health`),
  {
    refetch: computed(() => typeof localDiscover.data.value === 'string' && /\.local\.ropescore\.com(:\d+)?$/.test(localDiscover.data.value)),
    immediate: false
  }
).get().json()
useIntervalFn(() => {
  localDiscover.execute()
  if (typeof localDiscover.data.value === 'string' && /\.local\.ropescore\.com(:\d+)?$/.test(localDiscover.data.value)) {
    resolvedReachable.execute()
  }
}, 60_000)

export const localApis = ['', 'local-001']
export const localManual = useLocalStorage<string>('rs-local-api', null)
const manualReachable = useFetch(
  computed(() => `https://${localManual.value}.local.ropescore.com/.well-known/apollo/server-health`),
  {
    refetch: computed(() => !!localManual.value && localManual.value !== 'null'),
    immediate: !!localManual.value
  }
).get().json()
useIntervalFn(() => {
  if (!localManual.value || localManual.value === 'null') return
  manualReachable.execute()
}, 60_000)

export const apiDomain = computed(() => {
  if (localManual.value && manualReachable.data.value?.status === 'pass') return `${localManual.value}.local.ropescore.com`
  else if (
    typeof localDiscover.data.value === 'string' &&
    /\.local\.ropescore\.com(:\d+)?$/.test(localDiscover.data.value) &&
    resolvedReachable.data.value?.status === 'pass'
  ) {
    return localDiscover.data.value.trim()
  } else return 'api.ropescore.com'
})

function createLink () {
  const wsLink = new WebSocketLink({
    url: () => { return import.meta.env.VITE_GRAPHQL_WS_ENDPOINT ?? `wss://${apiDomain.value}/graphql` },
    lazy: true,
    connectionParams: () => {
      const auth = useAuth()
      watch(auth.token, () => {
        wsLink.client.restart()
      })

      return {
        Authorization: auth.token.value ? `Bearer ${auth.token.value}` : ''
      }
    }
  })

  const httpLink = createHttpLink({
    uri: () => { return import.meta.env.VITE_GRAPHQL_ENDPOINT ?? `https://${apiDomain.value}/graphql` }
  })

  const authLink = setContext(async (_, { headers }) => {
    const auth = useAuth()
    return {
      headers: {
        ...headers,
        authorization: auth.token.value ? `Bearer ${auth.token.value}` : ''
      }
    }
  })

  const splitLink = split(
    ({ query }) => {
      const definition = getMainDefinition(query)
      return (
        definition.kind === 'OperationDefinition' &&
      definition.operation === 'subscription'
      )
    },
    wsLink,
    authLink.concat(httpLink)
  )

  return splitLink
}

const cache = new InMemoryCache({
  typePolicies: {
    User: {
      fields: {
        streamShares: {
          merge: false
        }
      }
    }
  },
  possibleTypes: {
    Scoresheet: ['TallyScoresheet', 'MarkScoresheet']
  }
})

export const apolloClient = new ApolloClient({
  link: createLink(),
  cache
})

export const apolloClientAlternate = new ApolloClient({
  link: createLink(),
  cache
})
