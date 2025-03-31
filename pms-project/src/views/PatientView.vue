<template>
  <div class="user-view-container flex-row">
    <div class="side-bar-container">
      <nav class="nav flex-column">
        <router-link to="/PatientView/PatientDashboard">
          <span class="material-symbols-outlined">dashboard</span>
          Dashboard
        </router-link>
        <router-link to="/PatientView/BookAppointment">
          <span class="material-symbols-outlined">calendar_add_on</span>
          Book an Appointment
        </router-link>
        <router-link to="/PatientView/ViewAppointments">
          <span class="material-symbols-outlined">calendar_month</span>
          View My Appointments
        </router-link>
        <!-- Replace router-link with an element that calls logout -->
        <a href="#" @click.prevent="logout">
          <span class="material-symbols-outlined">logout</span>
          Log Out
        </a>
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
  name: "PatientView",
  methods: {
    logout() {
      const auth = getAuth();
      signOut(auth)
        .then(() => {
          // Clear cookies on logout
          Cookies.remove("loggedIn");
          Cookies.remove("lastActivity");
          Cookies.remove("userRole");
          // Redirect to the login page ("/")
          this.$router.push("/");
        })
        .catch((error) => {
          console.error("Error logging out:", error);
        });
    },
  },
};
</script>

<style scoped>
/* Your existing styles here */
</style>
