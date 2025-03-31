<template>
  <div class="dashboard-container">
    <h1 class="colored-text">Patient Dashboard</h1>
    <div class="dashboard-grid">
      <!-- Welcome Panel -->
      <div class="panel welcome-panel">
        <h2 v-if="patient.name">Welcome, {{ patient.name }}</h2>
        <h2 v-else>Welcome!</h2>
        <p>Last Checkup: {{ lastCheckup || 'N/A' }}</p>
      </div>
      <!-- Recent Vitals Panel -->
      <div class="panel vitals-panel">
        <h2>Recent Vitals</h2>
        <ul>
          <li><strong>BP:</strong> {{ vitals.bloodPressure || 'N/A' }} mmHg</li>
          <li><strong>HR:</strong> {{ vitals.heartRate || 'N/A' }} bpm</li>
          <li><strong>Temp:</strong> {{ vitals.temperature || 'N/A' }} °C</li>
          <li><strong>O₂:</strong> {{ vitals.oxygen || 'N/A' }}%</li>
        </ul>
      </div>
      <!-- Upcoming Appointments Panel -->
      <div class="panel appointments-panel">
        <h2>Appointments</h2>
        <ul v-if="upcomingAppointments.length">
          <li v-for="appointment in upcomingAppointments" :key="appointment.id">
            {{ appointment.date }} - {{ appointment.reason }}
          </li>
        </ul>
        <p v-else>No upcoming appointments.</p>
      </div>
      <!-- Medical History Panel -->
      <div class="panel history-panel">
        <h2>History</h2>
        <ul v-if="medicalHistory.length">
          <li v-for="record in medicalHistory" :key="record.id">
            {{ record.date }} - {{ record.diagnosis }}
          </li>
        </ul>
        <p v-else>No history available.</p>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from "vue";
import { doc, getDoc } from "firebase/firestore";
import { db, auth } from "../../firebase"; // Adjust path as needed

export default {
  name: "Dashboard",
  setup() {
    // Declare reactive variables.
    const patient = ref({ name: "" });
    const vitals = ref({ bloodPressure: "", heartRate: "", temperature: "", oxygen: "" });
    const lastCheckup = ref("");
    const upcomingAppointments = ref([]);
    const medicalHistory = ref([]);
    
    // Fetch dashboard data from the "users" collection (for patients).
    const fetchDashboardData = async () => {
      const user = auth.currentUser;
      if (user) {
        try {
          // Retrieve patient data from "users" collection.
          const docRef = doc(db, "users", user.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            // Map the fields to our reactive variables.
            patient.value.name = data.username || "";
            vitals.value = {
              bloodPressure: data.bloodPressure || "",
              heartRate: data.heartRate || "",
              temperature: data.temperature || "",
              oxygen: data.oxygenSaturation || ""
            };
            lastCheckup.value = data.lastCheckup || ""; // If available
            upcomingAppointments.value = data.appointments || [];
            medicalHistory.value = data.medicalHistory || [];
          }
        } catch (err) {
          console.error("Error fetching dashboard data:", err);
        }
      }
    };
    
    onMounted(() => {
      fetchDashboardData();
    });
    
    return { patient, vitals, lastCheckup, upcomingAppointments, medicalHistory };
  },
};
</script>

<style scoped>
.dashboard-container {
  width: 100%;
  max-width: 100%;
  padding: 1em;
  box-sizing: border-box;
  background-color: #f8f9fa;
  overflow-x: hidden;
  display: flex;
  flex-direction: column;
}

.colored-text {
  color: var(--primary-color, #007bff);
  text-align: center;
  margin-bottom: 0.5em;
  font-size: 1.8em;
}

.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1em;
  flex-grow: 1;
}

.panel {
  background: #fff;
  padding: 1em;
  border-radius: 6px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.panel h2 {
  margin-top: 0;
  margin-bottom: 0.5em;
  font-size: 1.2em;
  color: var(--primary-color, #007bff);
}

.panel p, .panel ul {
  margin: 0;
  font-size: 0.9em;
  color: #333;
}

.panel ul {
  list-style: none;
  padding-left: 0;
}

.panel ul li {
  margin-bottom: 0.3em;
}

@media (max-width: 600px) {
  .dashboard-grid {
    grid-template-columns: 1fr;
  }
}
</style>
