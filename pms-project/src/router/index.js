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
    component: DoctorView,
    redirect: '/DoctorView/DoctorDashboard',
    children: doctor_routes
  },
  {
    path: '/PatientView',
    name: 'PatientView',
    component: PatientView,
    redirect: '/PatientView/PatientDashboard',
    children: patient_routes
  }
]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
})

// Route guard: for login ("/") and register pages.
router.beforeEach((to, from, next) => {
  // If navigating to "/" or "/register":
  if (to.path === '/' || to.path === '/register') {
    if (Cookies.get('loggedIn') === 'true') {
      const userRole = Cookies.get('userRole')  // e.g., "Doctor" or "Patient"
      if (userRole === 'Doctor') {
        if (to.path !== '/DoctorView/DoctorDashboard') {
          next('/DoctorView/DoctorDashboard')
        } else {
          next()
        }
      } else if (userRole === 'Patient') {
        if (to.path !== '/PatientView/PatientDashboard') {
          next('/PatientView/PatientDashboard')
        } else {
          next()
        }
      } else {
        // If no valid role is stored, allow access to login page.
        next()
      }
    } else {
      // Not logged in: allow access to login or register.
      next()
    }
  } else {
    // For other routes, you might add authentication checks if needed.
    next()
  }
})

export default router
