import { createRouter, createWebHistory } from 'vue-router'
import Login from '@/components/auth/Login.vue'
import Register from '@/components/auth/Register.vue'
import DoctorView from '@/views/DoctorView.vue'
import PatientView from '@/views/PatientView.vue'

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
    path: '/doctor',
    name: 'doctor',
    component: DoctorView
  },
  {
    path: '/patient',
    name: 'patient',
    component: PatientView
  }
]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
})

export default router