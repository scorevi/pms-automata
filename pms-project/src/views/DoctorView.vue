<template>
  <div class="user-view-container flex-row">
    <div class="side-bar-container">
      <nav class="nav flex-column">
        <router-link to="/DoctorView/DoctorDashboard">
          <span class="material-symbols-outlined">dashboard</span>Dashboard
        </router-link>
        <router-link to="/DoctorView/ViewPatients">
          <span class="material-symbols-outlined">patient_list</span>View Patients
        </router-link>
        <router-link to="/DoctorView/ViewAppointments">
          <span class="material-symbols-outlined">calendar_month</span>View Appointments
        </router-link>
        <router-link to="/DoctorView/AddPatient">
          <span class="material-symbols-outlined">person_add</span>Add Patient
        </router-link>
        <!-- Logout link -->
        <a href="#" @click.prevent="logout">
          <span class="material-symbols-outlined">logout</span>Log Out
        </a>
        <!-- Doctor's license number label -->
        <div id="doctorLicenseNumber" v-if="doctorLicenseNumber">
          <span>License No. {{ doctorLicenseNumber }}</span>
        </div>
      </nav>
    </div>
    <div class="content-container">
      <router-view />
    </div>
  </div>
</template>

<script>
import { getAuth, signOut } from "firebase/auth";
import Cookies from "js-cookie";

export default {
  name: "DoctorView",
  computed: {
    doctorLicenseNumber() {
      return Cookies.get("licenseNumber");
    },
  },
  methods: {
    logout() {
      const auth = getAuth();
      signOut(auth)
        .then(() => {
          Cookies.remove("loggedIn");
          Cookies.remove("lastActivity");
          Cookies.remove("userRole");
          Cookies.remove("licenseNumber");
          this.$router.push("/");
        })
        .catch((error) => {
          console.error("Error during logout:", error);
        });
    },
  },
};
</script>

<style scoped>
#doctorLicenseNumber {
  color: #A0A7AF;
  text-align: center;
  margin-top: auto;
  padding: 1em 2em;
}
</style>
