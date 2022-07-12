import { createWebHistory, createRouter } from 'vue-router'

export default createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: async () => import('./views/Home.vue') },
    { path: '/groups', component: async () => import('./views/Groups.vue') },
    { path: '/groups/:groupId/live', component: async () => import('./views/Live.vue'), meta: { fullscreen: true } },
    { path: '/groups/:groupId/on-floor', component: async () => import('./views/OnFloor.vue'), meta: { fullscreen: true } },
    { path: '/groups/:groupId/next-up', component: async () => import('./views/NextUp.vue'), meta: { fullscreen: true } },
    { path: '/device-stream', component: async () => import('./views/DeviceStreamSetup.vue') },
    { path: '/device-stream/live', component: async () => import('./views/DeviceStreamLive.vue'), meta: { fullscreen: true } }
  ]
})
