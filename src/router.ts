import { createWebHistory, createRouter } from 'vue-router'
import { getAuth } from 'firebase/auth'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: async () => await import('./views/Home.vue'), meta: { menu: 'Dashboard', menuOrder: 1 } },
    { path: '/auth', component: async () => await import('./views/Auth.vue') },

    { path: '/groups', component: async () => await import('./views/Groups.vue'), meta: { authRequired: true, menu: 'Groups', menuOrder: 2 } },
    { path: '/groups/:groupId/on-floor', component: async () => await import('./views/ropescore/OnFloor.vue'), meta: { fullscreen: true, authRequired: true } },
    { path: '/groups/:groupId/next-up', component: async () => await import('./views/ropescore/NextUp.vue'), meta: { fullscreen: true, authRequired: true } },
    { path: '/groups/:groupId/leaderboard', component: async () => await import('./views/ropescore/Leaderboard.vue'), meta: { fullscreen: true, authRequired: true } },

    { path: '/device-stream', component: async () => await import('./views/device-stream/Config.vue'), meta: { authRequired: true, menu: 'Device Stream', menuOrder: 3 } },
    { path: '/device-stream/display', component: async () => await import('./views/device-stream/Display.vue'), meta: { fullscreen: true, authRequired: true } },

    { path: '/podium', component: async () => await import('./views/podium/Config.vue'), meta: { menu: 'Podium', menuOrder: 4 } },
    { path: '/podium/display', component: async () => await import('./views/podium/Display.vue'), meta: { fullscreen: true } },

    { path: '/on-floor-wall/', component: async () => await import('./views/on-floor-wall/Config.vue'), meta: { menu: 'On Floor Wall', menuOrder: 5 } },
    { path: '/on-floor-wall/display', component: async () => await import('./views/on-floor-wall/Display.vue'), meta: { fullscreen: true } },

    { path: '/qualifiers/', component: async () => await import('./views/qualifiers/Config.vue'), meta: { menu: 'Qualifiers', menuOrder: 6 } },
    { path: '/qualifiers/display', component: async () => await import('./views/qualifiers/Display.vue'), meta: { fullscreen: true } }
  ]
})
export default router

router.beforeEach(async (to) => {
  if (!to.meta.authRequired) return true
  const auth = getAuth()

  return await new Promise(resolve => {
    const off = auth.onAuthStateChanged(user => {
      off()
      if (user) resolve(true)
      else {
        resolve({
          path: '/auth',
          query: {
            'return-to': encodeURIComponent(to.fullPath)
          },
          replace: true
        })
      }
    })
  })
})
