<template>
  <div class="booking-container">
    <h1 class="colored-text">Book Appointment</h1>
    <form class="flex-column" @submit.prevent="bookAppointment">
      <!-- Doctor Selection --> 
      <div class="form-group">
        <label for="doctor">Doctor:</label>
        <select id="doctor" v-model="form.doctorId" @focus="onFocus" required>
          <option value="" disabled>Select a Doctor</option>
          <option 
            v-for="doctor in doctors" 
            :key="doctor.id" 
            :value="doctor.id">
            {{ formatDoctorDisplay(doctor) }}
          </option>
        </select>
      </div>
      
      <!-- Appointment Date --> 
      <div class="form-group">
        <label for="appointmentDate">Date:</label>
        <input id="appointmentDate" type="date" v-model="form.appointmentDate" @focus="onFocus" @blur="autoCorrectAppointment" required />
      </div>
      
      <!-- Appointment Time --> 
      <div class="form-group">
        <label for="appointmentTime">Time:</label>
        <input id="appointmentTime" type="time" v-model="form.appointmentTime" @focus="onFocus" required />
      </div>
      
      <!-- Reason for Appointment --> 
      <div class="form-group">
        <label for="reason">Reason:</label>
        <textarea id="reason" v-model="form.reason" @focus="onFocus" placeholder="Enter appointment reason" required></textarea>
      </div>
      
      <button type="submit" :disabled="state === states.PROCESSING || state === states.VALIDATING">
        Book Appointment
      </button>
    </form>
    <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>
    <p v-if="successMessage" class="success-message">{{ successMessage }}</p>
    <div class="status-label">{{ statusMessage }}</div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { collection, query, where, getDocs, addDoc } from 'firebase/firestore'
import { db, auth } from '../../firebase' // Adjust path as needed
import { onAuthStateChanged } from 'firebase/auth'

// Automata states
const states = {
  IDLE: 'idle',
  FILLING: 'filling',
  VALIDATING: 'validating',
  ERROR: 'error',
  PROCESSING: 'processing',
  SUCCESS: 'success'
}

const state = ref(states.IDLE)
const errorMessage = ref('')
const successMessage = ref('')

// Reactive form data for booking an appointment.
const form = reactive({
  doctorId: '',
  appointmentDate: '',
  appointmentTime: '',
  reason: ''
})

// List of available doctors.
const doctors = ref([])

// Fetch available doctors from Firestore (users where role == "Doctor")
const fetchDoctors = async () => {
  try {
    const q = query(collection(db, 'users'), where('role', '==', 'Doctor'))
    const querySnapshot = await getDocs(q)
    doctors.value = querySnapshot.docs.map(docSnap => ({
      id: docSnap.id,
      ...docSnap.data()
    }))
  } catch (error) {
    errorMessage.value = error.message
    state.value = states.ERROR
  }
}

onMounted(() => {
  fetchDoctors()
})

// Helper: Format doctor's display string. If fullName is not stored, convert username to title case.
const toTitleCase = (str) => {
  return str.replace(/\w\S*/g, (txt) => {
    return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
  })
}

const formatDoctorDisplay = (doctor) => {
  // If doctor has a fullName property, use it; otherwise, use username in title case.
  if (doctor.fullName && doctor.fullName.trim() !== '') return doctor.fullName
  if (doctor.username && doctor.username.trim() !== '') return toTitleCase(doctor.username)
  return 'N/A'
}

// Auto-correct appointment date: if selected date is in the past, set it to tomorrow.
const autoCorrectAppointment = () => {
  if (form.appointmentDate) {
    const selectedDate = new Date(form.appointmentDate)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    if (selectedDate < today) {
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)
      form.appointmentDate = tomorrow.toISOString().split('T')[0]
    }
  }
}

// onFocus to update state from error to filling.
const onFocus = () => {
  if (state.value === states.ERROR) {
    state.value = states.FILLING
  }
}

// Function to book the appointment.
const bookAppointment = async () => {
  errorMessage.value = ''
  successMessage.value = ''
  state.value = states.VALIDATING

  // Validate required fields.
  if (!form.doctorId || !form.appointmentDate || !form.appointmentTime || !form.reason) {
    errorMessage.value = 'All fields are required.'
    state.value = states.ERROR
    return
  }

  // Auto-correct appointment date if necessary.
  autoCorrectAppointment()

  // Ensure the appointment date is today or in the future.
  const selectedDate = new Date(form.appointmentDate)
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  if (selectedDate < now) {
    errorMessage.value = 'Appointment date must be today or in the future.'
    state.value = states.ERROR
    return
  }

  // Validate appointment time (expects HH:MM in 24-hour format).
  const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/
  if (!timeRegex.test(form.appointmentTime)) {
    errorMessage.value = 'Appointment time must be in HH:MM format (24-hour).'
    state.value = states.ERROR
    return
  }

  try {
    state.value = states.PROCESSING
    // Find the selected doctor's full name from the doctors list.
    const selectedDoctor = doctors.value.find(doc => doc.id === form.doctorId)
    const doctorFullName = selectedDoctor 
      ? (selectedDoctor.fullName ? selectedDoctor.fullName : toTitleCase(selectedDoctor.username)) 
      : 'N/A'

    const appointmentData = {
      doctorId: form.doctorId,
      doctorName: doctorFullName, // Store the doctor's name directly.
      patientId: auth.currentUser ? auth.currentUser.uid : 'unknown',
      appointmentDate: form.appointmentDate,
      appointmentTime: form.appointmentTime,
      reason: form.reason,
      createdAt: new Date(),
      status: 'Scheduled'
    }
    await addDoc(collection(db, 'appointments'), appointmentData)
    successMessage.value = 'Appointment booked successfully!'
    state.value = states.SUCCESS

    // Clear form fields.
    form.doctorId = ''
    form.appointmentDate = ''
    form.appointmentTime = ''
    form.reason = ''
  } catch (error) {
    errorMessage.value = error.message
    state.value = states.ERROR
  }
}

const statusMessage = computed(() => {
  switch (state.value) {
    case states.IDLE:
      return 'Waiting for input...'
    case states.FILLING:
      return 'Filling form...'
    case states.VALIDATING:
      return 'Validating inputs...'
    case states.ERROR:
      return 'Error: ' + errorMessage.value
    case states.PROCESSING:
      return 'Processing appointment...'
    case states.SUCCESS:
      return 'Appointment booked successfully!'
    default:
      return ''
  }
})
</script>

<style scoped>
.booking-container {
  padding: 1.5em;
  background-color: #f8f9fa;
  max-width: 100%;
  margin: 0 auto;
  box-sizing: border-box;
}

.colored-text {
  text-align: center;
  color: var(--primary-color, #007bff);
  margin-bottom: 1em;
}

.flex-column {
  display: flex;
  flex-direction: column;
  gap: 1em;
}

.form-group {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 0.5em;
}

.form-group label {
  width: 150px;
  font-weight: bold;
  text-align: right;
}

.form-group input,
.form-group select,
.form-group textarea {
  flex: 1;
  padding: 0.5em;
  font-size: 1em;
}

button {
  padding: 0.75em;
  font-size: 1em;
  background-color: var(--primary-color, #007bff);
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.error-message {
  color: red;
  text-align: center;
}

.success-message {
  color: green;
  text-align: center;
}

.status-label {
  text-align: center;
  font-style: italic;
  margin-top: 1em;
  color: #555;
}
</style>
