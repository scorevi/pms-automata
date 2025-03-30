import DoctorDashboard from '@/views/Doctor/Dashboard.vue';
import AddPatient from '@/views/Doctor/AddPatient.vue';
import ViewAppointments from '@/views/Doctor/ViewAppointments.vue';
import ViewPatients from '@/views/Doctor/ViewPatients.vue';

const doctor_routes = [
  {
    path: 'DoctorDashboard',
    name: 'DoctorDashboard',
    component: DoctorDashboard,
  },
  {
    path: 'ViewPatients',
    name: 'ViewPatients',
    component: ViewPatients,
  },
  {
    path: 'ViewAppointments',
    name: 'ViewAppointments',
    component: ViewAppointments,
  },
  {
    path: 'AddPatient',
    name: 'AddPatient',
    component: AddPatient,
  },
];

export default doctor_routes;