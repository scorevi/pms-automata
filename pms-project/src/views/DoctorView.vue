<template>
  <div>
    <nav>
      <router-link to="/DoctorView">Dashboard</router-link>
      <router-link to="/DoctorView/ViewPatients">View Patients</router-link>
      <router-link to="/DoctorView/ViewAppointments">View Appointments</router-link>
      <router-link to="/DoctorView/AddPatient">Add Patient</router-link>
    </nav>
    <div>
      <router-view />
    </div>
  </div>
</template>

<script>
export default {
  name: "DoctorView",
};
</script>
