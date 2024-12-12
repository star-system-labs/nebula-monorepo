import '@ungap/structured-clone';

import { createRouter, createWebHistory } from 'vue-router'
import PitchDeck from '../views/PitchDeck.vue'
import Login from '../components/Login.vue'

const routes = [
  {
    path: '/',
    name: 'pitchdeck',
    component: PitchDeck,
    meta: { requiresAuth: true },
  },
  {
    path: '/login',
    name: 'login',
    component: Login,
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

router.beforeEach((to, from, next) => {
  const isAuthenticated = localStorage.getItem('authenticated') === 'true'
  if (to.meta.requiresAuth && !isAuthenticated) {
    next({ name: 'login' })
  } else if (to.name === 'login' && isAuthenticated) {
    next({ name: 'pitchdeck' })
  } else {
    next()
  }
})

export default router
