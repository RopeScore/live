import * as Sentry from '@sentry/vue'
import { Integrations } from '@sentry/tracing'
import { createApp } from 'vue'
import 'virtual:windi.css'
import '../node_modules/@ropescore/components/dist/style.css'
import App from './App.vue'
import router from './router'
import { DefaultApolloClient } from '@vue/apollo-composable'
import { apolloClient } from './apollo'

const app = createApp(App)

app.provide(DefaultApolloClient, apolloClient)
  .use(router)
  .mount('#app')

Sentry.init({
  app,
  dsn: 'https://0f31d5c064474f00915d0b7f0bc5777f@o127465.ingest.sentry.io/6171736',
  release: import.meta.env.VITE_COMMIT_REF?.toString(),
  environment: import.meta.env.VITE_CONTEXT?.toString(),
  logErrors: true,
  integrations: [new Integrations.BrowserTracing({
    tracingOrigins: ['ropescore.live'],
    routingInstrumentation: Sentry.vueRouterInstrumentation(router)
  })],
  tracesSampleRate: 1.0
})