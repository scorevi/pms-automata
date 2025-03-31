<template>
  <div class="dashboard-container">
    <h1 class="colored-text">Doctor Dashboard</h1>
    <div class="dashboard-grid">
      <!-- Upcoming Appointments -->
      <div class="panel appointments-panel">
        <h2>Upcoming Appointments</h2>
        <ul v-if="upcomingAppointments.length">
          <li v-for="appt in upcomingAppointments" :key="appt.id">
            {{ formatDate(appt.appointmentDate) }} - {{ formatTime(appt.appointmentTime) }} : ({{ appt.reason || 'N/A' }})
          </li>
        </ul>
        <p v-else>No upcoming appointments.</p>
      </div>
      
      <!-- Patient List -->
      <div class="panel patients-panel">
        <h2>Patients</h2>
        <ul v-if="patients.length">
          <li v-for="patient in patients" :key="patient.id">
            {{ patient.name || 'Unknown' }} - {{ patient.contact || 'N/A' }}
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
import { ref, onMounted } from "vue";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db, auth } from "../../firebase";

export default {
  name: "DoctorDashboard",
  setup() {
    // Reactive variables
    const upcomingAppointments = ref([]);
    const patients = ref([]);
    const medicalRecords = ref([]);

    // **FORMAT HELPERS**
    const formatDate = (date) => {
      if (!date) return "N/A";
      const d = typeof date === "object" && date.seconds ? new Date(date.seconds * 1000) : new Date(date);
      return isNaN(d) ? "N/A" : d.toLocaleDateString();
    };

    const formatTime = (time) => {
      if (!time) return "N/A";
      if (typeof time === "object" && time.seconds) {
        const t = new Date(time.seconds * 1000);
        return t.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });
      }
      return time.match(/^\d{2}:\d{2}$/) ? time : "N/A";
    };

    // **FETCH DATA**
    const fetchDashboardData = async () => {
      const user = auth.currentUser;
      if (!user) return;

      try {
        // Fetch doctor's upcoming appointments
        const apptQuery = query(collection(db, "appointments"), where("doctorId", "==", user.uid));
        const apptSnapshot = await getDocs(apptQuery);

        let fetchedAppointments = [];
        apptSnapshot.forEach((docSnap) => {
          const data = docSnap.data();
          fetchedAppointments.push({
            id: docSnap.id,
            appointmentDate: data.appointmentDate,
            appointmentTime: data.appointmentTime,
            reason: data.reason || "N/A",
          });
        });
        upcomingAppointments.value = fetchedAppointments;

        // Fetch doctor's patients
        const patientQuery = query(collection(db, "users"), where("doctorAssigned", "==", user.uid));
        const patientSnapshot = await getDocs(patientQuery);

        let fetchedPatients = [];
        patientSnapshot.forEach((docSnap) => {
          const data = docSnap.data();
          fetchedPatients.push({
            id: docSnap.id,
            name: data.username || "Unknown",
            contact: data.contact || "N/A",
          });
        });
        patients.value = fetchedPatients;

        // Fetch recent medical records
        const recordsQuery = query(collection(db, "medicalRecords"), where("doctorId", "==", user.uid));
        const recordsSnapshot = await getDocs(recordsQuery);

        let fetchedRecords = [];
        recordsSnapshot.forEach((docSnap) => {
          const data = docSnap.data();
          fetchedRecords.push({
            id: docSnap.id,
            date: data.date || null,
            diagnosis: data.diagnosis || "No diagnosis",
          });
        });
        medicalRecords.value = fetchedRecords;
      } catch (err) {
        console.error("Error fetching doctor dashboard data:", err);
      }
    };

    onMounted(fetchDashboardData);

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
