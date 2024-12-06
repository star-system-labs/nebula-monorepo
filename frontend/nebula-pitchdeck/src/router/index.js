import '@ungap/structured-clone';

import { createRouter, createWebHistory } from 'vue-router'
import PitchDeck from '../views/PitchDeck.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
      {
        path: '/',
        name: 'pitchdeck',
        component: PitchDeck
      }
  ],
})

export default router
