import * as Sentry from '@sentry/vue'
import { createApp } from 'vue'
import '@unocss/reset/tailwind.css'
import '@github/time-elements'
import '@ropescore/components/style.css'
import 'uno.css'
import App from './App.vue'
import router from './router'
import { ApolloClients } from '@vue/apollo-composable'
import { apolloClient, apolloClientAlternate } from './apollo'
import { createHead } from '@vueuse/head'

const app = createApp(App)
const head = createHead()

app
  .provide(ApolloClients, {
    default: apolloClient,
    alternate: apolloClientAlternate
  })
  .use(router)
  .use(head)
  .mount('#app')

if (import.meta.env.PROD) {
  Sentry.init({
    app,
    dsn: 'https://0f31d5c064474f00915d0b7f0bc5777f@o127465.ingest.sentry.io/6171736',
    release: import.meta.env.VITE_COMMIT_REF?.toString(),
    environment: import.meta.env.VITE_CONTEXT?.toString(),
    logErrors: true,
    integrations: [new Sentry.BrowserTracing({
      tracingOrigins: ['ropescore.live'],
      routingInstrumentation: Sentry.vueRouterInstrumentation(router)
    })],
    tracesSampleRate: 1.0
  })
}
