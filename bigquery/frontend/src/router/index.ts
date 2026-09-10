import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth.store'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/leads',
    },
    {
      path: '/login',
      name: 'Login',
      component: () => import('../views/LoginView.vue'),
      meta: { public: true },
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

router.beforeEach((to) => {
  const auth = useAuthStore()

  if (to.meta.public) {
    if (to.name === 'Login' && auth.isAuthenticated) {
      return { path: '/leads' }
    }
    return true
  }

  if (!auth.isAuthenticated) {
    return { path: '/login', query: { redirect: to.fullPath } }
  }

  return true
})

export default router
