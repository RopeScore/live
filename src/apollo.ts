import { ApolloClient, createHttpLink, InMemoryCache, split } from '@apollo/client/core'
import { getMainDefinition } from '@apollo/client/utilities'
import { setContext } from '@apollo/client/link/context'
import { useAuth } from './hooks/auth'
import { WebSocketLink } from './graphql-ws'
import { watch } from 'vue'

const wsLink = new WebSocketLink({
  url: import.meta.env.VITE_GRAPHQL_WS_ENDPOINT ?? 'wss://api.ropescore.com/graphql',
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
  uri: import.meta.env.VITE_GRAPHQL_ENDPOINT ?? 'https://api.ropescore.com/graphql'
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

export const apolloClient = new ApolloClient({
  link: splitLink,
  cache
})
