<template>
  <div class="appointments-container">
    <h1 class="colored-text">View Appointments</h1>

    <!-- Status messages -->
    <div v-if="state === states.LOADING" class="info-message">
      Loading appointments...
    </div>
    <div v-else-if="state === states.ERROR" class="error-message">
      {{ errorMessage }}
    </div>

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
            <td>{{ appt.doctorFullName || 'N/A' }}</td>
            <td>{{ appt.reason || 'N/A' }}</td>
            <td>{{ appt.status || 'N/A' }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="status-label">{{ statusMessage }}</div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore'
import { db, auth } from '../../firebase'
import { onAuthStateChanged } from 'firebase/auth'

// Automata states
const states = {
  IDLE: 'idle',
  LOADING: 'loading',
  ERROR: 'error',
  SUCCESS: 'success'
}
const state = ref(states.IDLE)
const errorMessage = ref('')
const appointments = ref([])

// Helper: Convert a string to Title Case.
const toTitleCase = (str) => {
  return str.replace(/\w\S*/g, (txt) =>
    txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
  )
}

// Helper: Format appointmentDate to locale date string.
const formatDate = (date) => {
  if (!date) return 'N/A'
  const d =
    typeof date === 'object' && date.seconds
      ? new Date(date.seconds * 1000)
      : new Date(date)
  return isNaN(d) ? 'N/A' : d.toLocaleDateString()
}

// Helper: Format appointmentTime to 24-hour time string.
const formatTime = (time) => {
  if (!time) return 'N/A'
  if (typeof time === 'object' && time.seconds) {
    const t = new Date(time.seconds * 1000)
    return t.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
  }
  if (typeof time === 'string') {
    const regex = /^([01]\d|2[0-3]):([0-5]\d)$/
    if (regex.test(time)) return time
    const t = new Date('1970-01-01T' + time + ':00')
    return isNaN(t) ? 'N/A' : t.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
  }
  return 'N/A'
}

// Helper: Fetch doctor's full name using doctorId.
const getDoctorFullNameById = async (doctorId) => {
  if (!doctorId) return 'N/A'
  try {
    const docRef = doc(db, 'users', doctorId)
    const doctorSnap = await getDoc(docRef)
    if (doctorSnap.exists()) {
      const doctorData = doctorSnap.data()
      return doctorData.fullName || toTitleCase(doctorData.username || '')
    }
  } catch (err) {
    console.error('Error fetching doctor by ID:', err)
  }
  return 'N/A'
}

// Fetch appointments for the current patient.
const fetchAppointments = async (user) => {
  state.value = states.LOADING
  errorMessage.value = ''
  try {
    const q = query(collection(db, 'appointments'), where('patientId', '==', user.uid))
    const querySnapshot = await getDocs(q)
    let fetchedAppointments = []
    for (const docSnap of querySnapshot.docs) {
      const data = docSnap.data()
      // Fetch doctor's full name by using doctorId (if available)
      let doctorFullName = 'N/A'
      if (data.doctorId) {
        doctorFullName = await getDoctorFullNameById(data.doctorId)
      }
      fetchedAppointments.push({
        id: docSnap.id,
        appointmentDate: data.appointmentDate, // Timestamp or date string
        appointmentTime: data.appointmentTime, // Timestamp or time string
        doctorFullName: doctorFullName,
        reason: data.reason,
        status: data.status
      })
    }
    appointments.value = fetchedAppointments
    state.value = states.SUCCESS
  } catch (err) {
    errorMessage.value = err.message
    state.value = states.ERROR
  }
}

onMounted(() => {
  onAuthStateChanged(auth, (user) => {
    if (user) {
      fetchAppointments(user)
    } else {
      errorMessage.value = 'User not authenticated.'
      state.value = states.ERROR
    }
  })
})

const statusMessage = computed(() => {
  switch (state.value) {
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

.table-container {
  width: 100%;
  overflow-x: auto;
  box-sizing: border-box;
  margin: 0 auto;
}

table {
  width: 100%;
  min-width: 600px;
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
