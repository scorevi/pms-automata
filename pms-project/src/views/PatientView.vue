<template>
  <div>
    <nav>
      <router-link to="/PatientView">Dashboard</router-link>
      <router-link to="/PatientView/BookAppointment">Book an Appointment</router-link>
      <router-link to="/PatientView/ViewAppointments">View My Appointments</router-link>
    </nav>
    <div>
      <!-- Child components will be injected here -->
      <router-view />
    </div>
  </div>
</template>

<script>

export default {
  name: 'PatientView',
};
</script>