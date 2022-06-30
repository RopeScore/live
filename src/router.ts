import { createWebHistory, createRouter } from 'vue-router'

export default createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: async () => import('./views/Home.vue') },
    { path: '/groups', component: async () => import('./views/Groups.vue') },
    { path: '/groups/:groupId', component: async () => import('./views/Group.vue'), meta: { fullscreen: true } },
    { path: '/groups/:groupId/on-floor', component: async () => import('./views/OnFloor.vue'), meta: { fullscreen: true } }
  ]
})
