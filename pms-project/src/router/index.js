// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router'
import Cookies from 'js-cookie'

import Login from '@/components/auth/Login.vue'
import Register from '@/components/auth/Register.vue'
import DoctorView from '@/views/DoctorView.vue'
import PatientView from '@/views/PatientView.vue'

import doctor_routes from './doctor_routes'
import patient_routes from './patient_routes'

const routes = [
  {
    path: '/',
    name: 'login',
    component: Login
  },
  {
    path: '/register',
    name: 'register',
    component: Register
  },
  {
    path: '/DoctorView',
    name: 'DoctorView',
    component: DoctorView,  // Make sure this component includes a <router-view />
    meta: { requiresAuth: true },
    redirect: '/DoctorView/DoctorDashboard',
    children: doctor_routes
  },
  {
    path: '/PatientView',
    name: 'PatientView',
    component: PatientView,
    meta: { requiresAuth: true },
    redirect: '/PatientView/PatientDashboard',
    children: patient_routes
  }
]

const router = createRouter({
  history: createWebHistory('/'),
  routes
})
// Global route guard:
router.beforeEach((to, from, next) => {
  // If any matched route requires auth:
  if (to.matched.some(record => record.meta.requiresAuth)) {
    if (Cookies.get('loggedIn') !== 'true') {
      // Not logged in: redirect to login.
      return next({ path: '/' })
    }
  }

  // For login and register pages: if already logged in, redirect based on role.
  if (to.path === '/' || to.path === '/register') {
    if (Cookies.get('loggedIn') === 'true') {
      const userRole = Cookies.get('userRole') // "Doctor" or "Patient"
      if (userRole === 'Doctor') {
        return next('/DoctorView/DoctorDashboard')
      } else if (userRole === 'Patient') {
        return next('/PatientView/PatientDashboard')
      }
    }
  }

  next()
})


export default router
