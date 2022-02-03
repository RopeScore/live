import { ApolloClient, createHttpLink, InMemoryCache, split } from '@apollo/client/core'
import { getMainDefinition } from '@apollo/client/utilities'
import { setContext } from '@apollo/client/link/context'
import { useAuth } from './hooks/auth'
import { WebSocketLink } from './graphql-ws'
import { watch } from 'vue'

const wsLink = new WebSocketLink({
  url: 'wss://api.ropescore.com/',
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
  uri: 'https://api.ropescore.com/'
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

const cache = new InMemoryCache()

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
