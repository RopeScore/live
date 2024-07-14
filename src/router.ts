import { createWebHistory, createRouter } from 'vue-router'
import { getAuth } from 'firebase/auth'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: async () => import('./views/Home.vue'), meta: { menu: 'Dashboard', menuOrder: 1 } },
    { path: '/auth', component: async () => import('./views/Auth.vue') },

    { path: '/groups', component: async () => import('./views/Groups.vue'), meta: { authRequired: true, menu: 'Groups', menuOrder: 2 } },
    { path: '/groups/:groupId/live', component: async () => import('./views/Live.vue'), meta: { fullscreen: true, authRequired: true } },
    { path: '/groups/:groupId/on-floor', component: async () => import('./views/OnFloor.vue'), meta: { fullscreen: true, authRequired: true } },
    { path: '/groups/:groupId/next-up', component: async () => import('./views/NextUp.vue'), meta: { fullscreen: true, authRequired: true } },
    { path: '/groups/:groupId/leaderboard', component: async () => import('./views/Leaderboard.vue'), meta: { fullscreen: true, authRequired: true } },

    { path: '/device-stream', component: async () => import('./views/DeviceStreamConfig.vue'), meta: { authRequired: true, menu: 'Device Stream', menuOrder: 3 } },
    { path: '/device-stream/live', component: async () => import('./views/DeviceStreamLive.vue'), meta: { fullscreen: true, authRequired: true } },

    { path: '/podium', component: async () => import('./views/PodiumConfig.vue'), meta: { menu: 'Podium', menuOrder: 4 } },
    { path: '/podium/live', component: async () => import('./views/PodiumLive.vue'), meta: { fullscreen: true } },

    { path: '/on-floor-wall/', component: async () => import('./views/OnFloorWallConfig.vue'), meta: { menu: 'On Floor Wall', menuOrder: 5 } },
    { path: '/on-floor-wall/:vendor/:id', component: async () => import('./views/OnFloorWallLive.vue'), meta: { fullscreen: true } }
  ]
})
export default router

router.beforeEach(async (to) => {
  if (!to.meta.authRequired) return true
  const auth = getAuth()

  return new Promise(resolve => {
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
