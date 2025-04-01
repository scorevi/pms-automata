<template>
  <div class="dashboard-container">
    <h1 class="colored-text">Patient Dashboard</h1>
    
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
    
    <!-- Appointments Panel -->
    <div class="panel appointments-panel">
      <h2>Appointments</h2>
      <ul v-if="upcomingAppointments.length">
        <li v-for="appointment in upcomingAppointments" :key="appointment.id">
          {{ formatDate(appointment.appointmentDate) }} - 
          {{ formatTime(appointment.appointmentTime) }} : 
          {{ appointment.reason || 'N/A' }} ({{ appointment.status || 'N/A' }})
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
    
    <div class="status-label">{{ statusMessage }}</div>
  </div>
</template>

<script>
import { ref, onMounted, computed } from "vue";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { db, auth } from "../../firebase"; // Adjust path as needed
import { onAuthStateChanged } from "firebase/auth";

export default {
  name: "Dashboard",
  setup() {
    // Reactive variables for patient data.
    const patient = ref({ name: "" });
    const vitals = ref({ bloodPressure: "", heartRate: "", temperature: "", oxygen: "" });
    const lastCheckup = ref("");
    const upcomingAppointments = ref([]);
    const medicalHistory = ref([]);
    const state = ref("idle");
    const errorMessage = ref("");

    // Helper: Format date to locale string.
    const formatDate = (date) => {
      if (!date) return "N/A";
      const d =
        typeof date === "object" && date.seconds
          ? new Date(date.seconds * 1000)
          : new Date(date);
      return isNaN(d) ? "N/A" : d.toLocaleDateString();
    };

    // Helper: Format time to 24-hour string.
    const formatTime = (time) => {
      if (!time) return "N/A";
      if (typeof time === "object" && time.seconds) {
        const t = new Date(time.seconds * 1000);
        return t.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        });
      }
      if (typeof time === "string") {
        const regex = /^([01]\d|2[0-3]):([0-5]\d)$/;
        if (regex.test(time)) return time;
        const t = new Date("1970-01-01T" + time + ":00");
        return isNaN(t)
          ? "N/A"
          : t.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
              hour12: false,
            });
      }
      return "N/A";
    };

    // Fetch general patient data from "users" collection.
    const fetchDashboardData = async (user) => {
      try {
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          patient.value.name = data.username || "";
          vitals.value = {
            bloodPressure: data.bloodPressure || "",
            heartRate: data.heartRate || "",
            temperature: data.temperature || "",
            oxygen: data.oxygenSaturation || "",
          };
          lastCheckup.value = data.lastCheckup || "";
          medicalHistory.value = data.medicalHistory || [];
        }
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
      }
    };

    // Fetch appointments from "appointments" collection.
    const fetchAppointments = async (user) => {
      try {
        const q = query(
          collection(db, "appointments"),
          where("patientId", "==", user.uid)
        );
        const querySnapshot = await getDocs(q);
        const fetchedAppointments = querySnapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          return {
            id: docSnap.id,
            appointmentDate: data.appointmentDate,
            appointmentTime: data.appointmentTime,
            reason: data.reason,
            status: data.status,
          };
        });
        upcomingAppointments.value = fetchedAppointments;
      } catch (err) {
        console.error("Error fetching appointments:", err);
      }
    };

    // Set a combined status message.
    const statusMessage = computed(() => {
      if (state.value === "loading") return "Loading dashboard data...";
      if (state.value === "error") return "Error: " + errorMessage.value;
      if (state.value === "success") return "Dashboard loaded successfully!";
      return "";
    });

    onMounted(() => {
      onAuthStateChanged(auth, (user) => {
        if (user) {
          state.value = "loading";
          Promise.all([fetchDashboardData(user), fetchAppointments(user)])
            .then(() => {
              state.value = "success";
            })
            .catch((err) => {
              errorMessage.value = err.message;
              state.value = "error";
            });
        } else {
          errorMessage.value = "User not authenticated.";
          state.value = "error";
        }
      });
    });

    return {
      patient,
      vitals,
      lastCheckup,
      upcomingAppointments,
      medicalHistory,
      formatDate,
      formatTime,
      state,
      errorMessage,
      statusMessage,
    };
  },
};
</script>

<style scoped>
.dashboard-container {
  width: 100%;
  max-width: 100%;
  padding: 1em;
  box-sizing: border-box;
  overflow-x: hidden;
  display: flex;
  flex-direction: column;
  gap: 1em;
  justify-content: flex-start;
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

.panel p,
.panel ul {
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
