<template>
  <div class="dashboard-container">
    <h1 class="colored-text">Doctor Dashboard</h1>
    <div class="dashboard-grid">
      <!-- Upcoming Appointments -->
      <div class="panel appointments-panel">
        <h2>Upcoming Appointments</h2>
        <ul v-if="upcomingAppointments.length">
          <li v-for="appt in upcomingAppointments" :key="appt.id">
            {{ formatDate(appt.appointmentDate) }} - {{ formatTime(appt.appointmentTime) }} : ({{ appt.reason }})
          </li>
        </ul>
        <p v-else>No upcoming appointments.</p>
      </div>
      
      <!-- Patients List (displaying only the patient's name) -->
      <div class="panel patients-panel">
        <h2>Patients</h2>
        <ul v-if="patients.length">
          <li v-for="patient in patients" :key="patient.id">
            {{ patient.name }}
          </li>
        </ul>
        <p v-else>No registered patients.</p>
      </div>

      <!-- Medical Records -->
      <div class="panel records-panel">
        <h2>Recent Medical Records</h2>
        <ul v-if="medicalRecords.length">
          <li v-for="record in medicalRecords" :key="record.id">
            {{ formatDate(record.date) }} - {{ record.diagnosis }}
          </li>
        </ul>
        <p v-else>No recent records.</p>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted } from "vue";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { auth, db } from "../../firebase";

export default {
  name: "DoctorDashboard",
  setup() {
    // Reactive references
    const upcomingAppointments = ref([]);
    const patients = ref([]);
    const medicalRecords = ref([]);
    
    // To keep track of all unsubscribe functions for cleanup
    const unsubscribeList = [];

    // Format helpers for dates and times
    const formatDate = (date) => {
      if (!date) return "N/A";
      const d =
        typeof date === "object" && date.seconds
          ? new Date(date.seconds * 1000)
          : new Date(date);
      return isNaN(d) ? "N/A" : d.toLocaleDateString();
    };

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
      return time.match(/^\d{2}:\d{2}$/) ? time : "N/A";
    };

    // Function to set up real-time listeners after user auth is confirmed
    const setupListeners = (user) => {
      // Upcoming Appointments Listener
      const apptQuery = query(
        collection(db, "appointments"),
        where("doctorId", "==", user.uid)
      );
      const unsubscribeAppointments = onSnapshot(apptQuery, (snapshot) => {
        const fetchedAppointments = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          fetchedAppointments.push({
            id: doc.id,
            appointmentDate: data.appointmentDate,
            appointmentTime: data.appointmentTime,
            reason: data.reason || "N/A",
          });
        });
        upcomingAppointments.value = fetchedAppointments;
      });
      unsubscribeList.push(unsubscribeAppointments);

      // Patients Listener (fetching all patients and displaying only the name)
      const patientQuery = query(collection(db, "users"));
      const unsubscribePatients = onSnapshot(patientQuery, (snapshot) => {
        const fetchedPatients = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          fetchedPatients.push({
            id: doc.id,
            name: data.username || "Unknown",
          });
        });
        patients.value = fetchedPatients;
      });
      unsubscribeList.push(unsubscribePatients);

      // Medical Records Listener
      const recordsQuery = query(
        collection(db, "medicalRecords"),
        where("doctorId", "==", user.uid)
      );
      const unsubscribeRecords = onSnapshot(recordsQuery, (snapshot) => {
        const fetchedRecords = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          fetchedRecords.push({
            id: doc.id,
            date: data.date || null,
            diagnosis: data.diagnosis || "No diagnosis",
          });
        });
        medicalRecords.value = fetchedRecords;
      });
      unsubscribeList.push(unsubscribeRecords);
    };

    // Listen for authentication state changes so that we only set up listeners when the user is ready
    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      if (user) {
        setupListeners(user);
      }
    });

    onMounted(() => {
      // Additionally check if the user is already available and setup listeners if needed.
      const currentUser = auth.currentUser;
      if (currentUser) {
        setupListeners(currentUser);
      }
    });

    onUnmounted(() => {
      unsubscribeList.forEach((unsub) => unsub());
      if (unsubscribeAuth) unsubscribeAuth();
    });

    return { upcomingAppointments, patients, medicalRecords, formatDate, formatTime };
  },
};
</script>

<style scoped>
.dashboard-container {
  padding: 1em;
  background-color: #f8f9fa;
  width: 100%;
  box-sizing: border-box;
  overflow-x: hidden;
}

.colored-text {
  text-align: center;
  color: var(--primary-color, #007bff);
  margin-bottom: 1em;
}

.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1em;
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
