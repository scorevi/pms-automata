<template>
  <div class="appointments-container">
    <h1 class="colored-text">View Appointments</h1>
    
    <!-- Status messages for loading/error states -->
    <div v-if="state === states.LOADING" class="info-message">Loading appointments...</div>
    <div v-else-if="state === states.ERROR" class="error-message">{{ errorMessage }}</div>
    
    <!-- Appointments Table -->
    <div v-else class="table-container">
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Time</th>
            <th>Doctor</th>
            <th>Reason</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="appt in appointments" :key="appt.id">
            <td>{{ formatDate(appt.appointmentDate) }}</td>
            <td>{{ formatTime(appt.appointmentTime) }}</td>
            <td>{{ appt.doctorName || 'N/A' }}</td>
            <td>{{ appt.reason }}</td>
            <td>{{ appt.status }}</td>
          </tr>
        </tbody>
      </table>
    </div>
    
    <div class="status-label">{{ statusMessage }}</div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { db, auth } from '../../firebase' // Adjust path as needed

// Define automata states
const states = {
  IDLE: 'idle',
  LOADING: 'loading',
  ERROR: 'error',
  SUCCESS: 'success'
}
const state = ref(states.IDLE)
const errorMessage = ref('')
const appointments = ref([])

// Fetch appointments for the current patient from Firestore.
// Assumes appointments are saved with field names: appointmentDate, appointmentTime, doctorName, reason, status.
const fetchAppointments = async () => {
  state.value = states.LOADING
  errorMessage.value = ''
  try {
    const currentUser = auth.currentUser
    if (!currentUser) throw new Error("User not authenticated.")
    
    const q = query(collection(db, 'appointments'), where('patientId', '==', currentUser.uid))
    const querySnapshot = await getDocs(q)
    appointments.value = querySnapshot.docs.map(docSnap => {
      const data = docSnap.data()
      // Convert appointmentDate if it's a Firestore Timestamp
      if (data.appointmentDate && data.appointmentDate.seconds) {
        data.appointmentDate = new Date(data.appointmentDate.seconds * 1000)
      }
      // Convert appointmentTime if it's a Firestore Timestamp
      if (data.appointmentTime && data.appointmentTime.seconds) {
        data.appointmentTime = new Date(data.appointmentTime.seconds * 1000)
      }
      return { id: docSnap.id, ...data }
    })
    state.value = states.SUCCESS
  } catch (err) {
    errorMessage.value = err.message
    state.value = states.ERROR
  }
}

onMounted(() => {
  fetchAppointments()
})

// Helper: Format appointmentDate to locale date string.
const formatDate = (date) => {
  if (!date) return 'N/A'
  const d = date.seconds ? new Date(date.seconds * 1000) : new Date(date)
  return d.toLocaleDateString()
}

// Helper: Format appointmentTime to locale time string.
const formatTime = (time) => {
  if (!time) return 'N/A'
  const t = time.seconds ? new Date(time.seconds * 1000) : new Date(time)
  return t.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

// Computed status message reflecting the automata state.
const statusMessage = computed(() => {
  switch(state.value) {
    case states.LOADING:
      return 'Loading appointments...'
    case states.ERROR:
      return 'Error: ' + errorMessage.value
    case states.SUCCESS:
      return 'Appointments loaded successfully!'
    default:
      return ''
  }
})
</script>

<style scoped>
.appointments-container {
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

/* Table container: Only the table scrolls horizontally if needed */
.table-container {
  width: 100%;
  overflow-x: auto;
  box-sizing: border-box;
  margin: 0 auto;
}

table {
  width: 100%;
  min-width: 600px; /* Ensures horizontal scroll if necessary */
  border-collapse: collapse;
  background-color: #fff;
  margin: 0 auto;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

th, td {
  padding: 10px;
  border-bottom: 1px solid #ddd;
  text-align: left;
}

th {
  background-color: var(--primary-color, #007bff);
  color: #fff;
}

.status-label {
  text-align: center;
  font-style: italic;
  margin-top: 1em;
  color: #555;
}

.info-message {
  text-align: center;
  color: #333;
}

.error-message {
  text-align: center;
  color: red;
}
</style>
