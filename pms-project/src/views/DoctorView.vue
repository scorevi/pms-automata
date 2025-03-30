<template>
  <div class="user-view-container flex-row">
    <div class="side-bar-container">
      <nav class="nav flex-column">
        <router-link to="/DoctorView/DoctorDashboard"><span class="material-symbols-outlined">dashboard</span>Dashboard</router-link>
        <router-link to="/DoctorView/ViewPatients"><span class="material-symbols-outlined">patient_list</span>View Patients</router-link>
        <router-link to="/DoctorView/ViewAppointments"><span class="material-symbols-outlined">calendar_month</span>View Appointments</router-link>
        <router-link to="/DoctorView/AddPatient"><span class="material-symbols-outlined">person_add</span>Add Patient</router-link>
      </nav>
    </div>
    <div class="content-container">
      <router-view />
    </div>
  </div>
</template>

<script>
export default {
  name: "DoctorView",
};
</script>