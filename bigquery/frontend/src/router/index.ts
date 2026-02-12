import { createRouter, createWebHistory } from 'vue-router'
import LeadsView from '../views/LeadsView.vue'
import CampaignsView from '../views/CampaignsView.vue'

const routes = [
  { path: '/', redirect: '/leads' },
  { path: '/leads', component: LeadsView },
  { path: '/campaigns', component: CampaignsView },
]

export default createRouter({
  history: createWebHistory(),
  routes,
})