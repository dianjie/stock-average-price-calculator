import { createRouter, createWebHashHistory } from 'vue-router'
import { getCurrentUser } from '../firebase/auth'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('../pages/HomePage.vue'),
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('../pages/LoginPage.vue'),
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('../pages/RegisterPage.vue'),
  },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
})

router.beforeEach((to, from, next) => {
  const user = getCurrentUser()
  const isGuest = localStorage.getItem('isGuest') === 'true'

  if ((to.path === '/login' || to.path === '/register') && (user || isGuest)) {
    next('/')
    return
  }

  next()
})

export default router
