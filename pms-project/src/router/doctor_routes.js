// doctor_routes.js
import Dashboard from '@/views/Doctor/Dashboard.vue';
import ViewPatients from '@/views/Doctor/ViewPatients.vue';
import AddPatient from '@/views/Doctor/AddPatient.vue';
import ViewAppointments from '@/views/Doctor/ViewAppointments.vue';

const doctor_routes = [
  {
    path: 'DoctorDashboard',
    name: 'DoctorDashboard',
    component: Dashboard,
  },
  {
    path: 'ViewPatients',
    name: 'ViewPatients',
    component: ViewPatients,
  },
  {
    path: 'ViewAppointments',
    name: 'DoctorViewAppointments',
    component: ViewAppointments,
  },
  {
    path: 'AddPatient',
    name: 'AddPatient',
    component: AddPatient,
  },
];

export default doctor_routes;
