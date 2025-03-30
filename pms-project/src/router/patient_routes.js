import Dashboard from '@/views/Patient/Dashboard.vue';
import ViewAppointments from '@/views/Patient/ViewAppointments.vue';
import BookAppointment from '@/views/Patient/BookAppointment.vue';

const patient_routes = [
  {
    path: 'PatientDashboard',
    name: 'PatientDashboard',
    component: Dashboard,
  },
  {
    path: 'ViewAppointments',
    name: 'ViewAppointments',
    component: ViewAppointments,
  },
  {
    path: 'BookAppointment',
    name: 'BookAppointment',
    component: BookAppointment,
  },
];

export default patient_routes;