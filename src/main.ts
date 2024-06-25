import * as Sentry from '@sentry/vue'
import { type Component, createApp } from 'vue'
import '@unocss/reset/tailwind.css'
import '@github/relative-time-element'
import '@ropescore/components/style.css'
import 'uno.css'
import App from './App.vue'
import router from './router'
import { ApolloClients } from '@vue/apollo-composable'
import { apolloClient, apolloClientAlternate } from './apollo'
import { createHead } from '@vueuse/head'
import { initializeApp } from 'firebase/app'

initializeApp({
  apiKey: 'AIzaSyCbOo3XqKZfQWkfudXQ-_5OKvNaWnSeRsA',
  authDomain: 'ropescore-app.firebaseapp.com',
  projectId: 'ropescore-app',
  messagingSenderId: '224455118938',
  appId: '1:224455118938:web:f922c0fb34bc3bb2398863'
})

const app = createApp(App as Component)
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
    integrations: [Sentry.browserTracingIntegration({
      router,
    })],
    tracePropagationTargets: ['ropescore.com', 'ropescore.app', 'api.ropescore.com', 'ropescore.live', 'core.ropescore.com'],
    tracesSampleRate: 1.0
  })
}
