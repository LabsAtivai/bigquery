import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/leads',
    },
    {
      path: '/leads',
      name: 'Leads',
      component: () => import('../views/LeadsView.vue'),
    },
    {
      path: '/campaigns',
      name: 'Campaigns',
      component: () => import('../views/CampaignsView.vue'),
    },
    {
      path: '/imports',
      name: 'Imports',
      component: () => import('../views/ImportsView.vue'),
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/leads',
    },
  ],
})

export default router
