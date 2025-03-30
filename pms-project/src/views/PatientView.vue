<template>
  <div class="user-view-container flex-row">
    <div class="side-bar-container">
      <nav class="nav flex-column">
        <router-link to="/PatientView/PatientDashboard"><span class="material-symbols-outlined">dashboard</span>Dashboard</router-link>
        <router-link to="/PatientView/BookAppointment"><span class="material-symbols-outlined">calendar_add_on</span>Book an Appointment</router-link>
        <router-link to="/PatientView/ViewAppointments"><span class="material-symbols-outlined">calendar_month</span>View My Appointments</router-link>
      </nav>
    </div>
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