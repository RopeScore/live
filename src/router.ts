import { createWebHistory, createRouter } from 'vue-router'

export default createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: async () => import('./views/Home.vue') },
    { path: '/groups', component: async () => import('./views/Groups.vue') },
    { path: '/groups/:id', component: async () => import('./views/Group.vue') }
  ]
})
