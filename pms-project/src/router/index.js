import { createRouter, createWebHistory } from 'vue-router'
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
  },
  doctor_routes
]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
})

export default router