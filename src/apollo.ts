import { ApolloClient, createHttpLink, InMemoryCache, split } from '@apollo/client/core'
import { getMainDefinition } from '@apollo/client/utilities'
import { setContext } from '@apollo/client/link/context'
import { useAuth } from './hooks/auth'
import { WebSocketLink } from './graphql-ws'
import { watch, computed } from 'vue'
import { useFetch, useIntervalFn, useLocalStorage } from '@vueuse/core'
import { getAuth } from 'firebase/auth'

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

export const localApis = ['', 'local-001', 'local-002', 'local-003', 'dev']
export const localManual = useLocalStorage<string>('rs-local-api', null)
const manualReachable = useFetch(
  computed(() => localManual.value === 'dev'
    ? 'http://localhost:5000/.well-known/apollo/server-health'
    : `https://${localManual.value}.local.ropescore.com/.well-known/apollo/server-health`),
  {
    refetch: computed(() => !!localManual.value && localManual.value !== 'null'),
    immediate: !!localManual.value
  }
).get().json()
useIntervalFn(() => {
  manualReachable.execute()
}, 60_000)

export const apiDomain = computed(() => {
  if (localManual.value === 'dev' && manualReachable.data.value?.status === 'pass') return 'localhost:5000'
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
    connectionParams: async () => {
      const oldAuth = useAuth()
      watch(oldAuth.token, () => {
        wsLink.client.restart()
      })

      const auth = getAuth()
      auth.onIdTokenChanged(() => {
        wsLink.client.restart()
      })

      const token = oldAuth.token.value
      const firebaseToken = await new Promise<string | undefined>((resolve, reject) => {
        const off = auth.onAuthStateChanged(user => {
          off()
          if (user) {
            user.getIdToken()
              .then(token => { resolve(token) })
              .catch(err => { reject(err) })
          } else resolve(undefined)
        })
      })

      return {
        Authorization: token ? `Bearer ${token}` : '',
        'Firebase-Authorization': firebaseToken ? `Bearer ${firebaseToken}` : ''
      }
    }
  })

  const httpLink = createHttpLink({
    uri: () => { return import.meta.env.VITE_GRAPHQL_ENDPOINT ?? `https://${apiDomain.value}/graphql` }
  })

  const authLink = setContext(async (_, { headers }) => {
    const oldAuth = useAuth()
    const auth = getAuth()
    const token = oldAuth.token.value
    const firebaseToken = await new Promise<string | undefined>((resolve, reject) => {
      const off = auth.onAuthStateChanged(user => {
        off()
        if (user) {
          user.getIdToken()
            .then(token => { resolve(token) })
            .catch(err => { reject(err) })
        } else resolve(undefined)
      })
    })

    return {
      headers: {
        ...headers,
        authorization: token ? `Bearer ${token}` : '',
        'firebase-authorization': firebaseToken ? `Bearer ${firebaseToken}` : ''
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
