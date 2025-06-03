import { ApolloClient, createHttpLink, InMemoryCache, split } from '@apollo/client/core'
import { getMainDefinition } from '@apollo/client/utilities'
import { setContext } from '@apollo/client/link/context'
import { useAuth } from './hooks/auth'
import { WebSocketLink } from './graphql-ws'
import { watch, computed } from 'vue'
import { useFetch, useIntervalFn, useLocalStorage } from '@vueuse/core'
import { getAuth } from 'firebase/auth'
import { Kind, OperationTypeNode } from 'graphql'

const localDiscover = useFetch('http://ropescore.local').get().text()
const resolvedReachable = useFetch(
  computed(() => `https://${localDiscover.data.value}/.well-known/apollo/server-health`),
  {
    refetch: computed(() => typeof localDiscover.data.value === 'string' && /\.local\.ropescore\.com(:\d+)?$/.test(localDiscover.data.value)),
    immediate: false,
    timeout: 5_000
  }
).get().json()
useIntervalFn(() => {
  void localDiscover.execute().then(async () => {
    if (typeof localDiscover.data.value === 'string' && /\.local\.ropescore\.com(:\d+)?$/.test(localDiscover.data.value)) {
      await resolvedReachable.execute()
    }
  })
}, 60_000)

export const localApis = ['', 'local-001', 'local-002', 'local-003', 'local-004', 'local-005', 'dev']
export const localManual = useLocalStorage<string>('rs-local-api', null)
const manualReachable = useFetch(
  computed(() => localManual.value === 'dev'
    ? 'http://localhost:5000/.well-known/apollo/server-health'
    : `https://${localManual.value}.local.ropescore.com/.well-known/apollo/server-health`),
  {
    refetch: computed(() => !!localManual.value && localManual.value !== 'null' && localManual.value !== 'undefined'),
    immediate: !!localManual.value,
    timeout: 5_000
  }
).get().json()
useIntervalFn(() => {
  void manualReachable.execute()
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
    url: () => { return import.meta.env.VITE_GRAPHQL_WS_ENDPOINT ?? `${apiDomain.value.includes('localhost') ? 'ws' : 'wss'}://${apiDomain.value}/graphql` },
    lazy: true,
    connectionParams: async () => {
      const oldAuth = useAuth()
      const offOld = watch(oldAuth.token, () => {
        console.log('restarting due to old auth')
        wsLink.client.restart()
        offOld()
      })

      const auth = getAuth()
      let firstChange = false
      const offNew = auth.onIdTokenChanged(() => {
        if (!firstChange) {
          firstChange = true
          return
        }
        console.log('restarting due to new auth')
        wsLink.client.restart()
        offNew()
      })

      const token = oldAuth.token.value
      const firebaseToken = await new Promise<string | undefined>((resolve, reject) => {
        const off = auth.onAuthStateChanged(user => {
          off()
          if (user) {
            user.getIdToken()
              .then(token => { resolve(token) })
              .catch((err: Error) => { reject(err) })
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
    uri: () => { return import.meta.env.VITE_GRAPHQL_ENDPOINT ?? `${apiDomain.value.includes('localhost') ? 'http' : 'https'}://${apiDomain.value}/graphql` }
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
            .catch((err: Error) => { reject(err) })
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
        definition.kind === Kind.OPERATION_DEFINITION &&
        definition.operation === OperationTypeNode.SUBSCRIPTION
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
