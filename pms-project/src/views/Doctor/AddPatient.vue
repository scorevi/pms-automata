<script setup>
import { reactive, ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth'
import { doc, setDoc } from 'firebase/firestore'
import { auth, db } from '../../firebase'  // Adjust the path as needed
import Cookies from 'js-cookie'

const router = useRouter()

const states = {
  IDLE: 'idle',
  FILLING: 'filling',
  VALIDATING: 'validating',
  ERROR: 'error',
  REGISTERING: 'registering',
  SUCCESS: 'success'
}

const state = ref(states.IDLE)
const errorMessage = ref('')
const successMessage = ref('')

// Reactive form data for a new patient.
const form = reactive({
  name: '',
  age: '',
  sex: '',
  bloodPressure: '',
  heartRate: '',
  temperature: '',
  oxygenSaturation: '',
  respiratoryRate: ''
})

// Helper: Sanitize the name for password (remove spaces and non-alphanumerics, lowercase)
const sanitizeNameForPassword = (name) => {
  return name.replace(/[^a-zA-Z0-9]/g, '').toLowerCase()
}

// Auto-correct function for numeric fields.
const autoCorrect = (field) => {
  if (field === 'age') {
    let a = parseInt(form.age, 10)
    if (isNaN(a)) {
      errorMessage.value = 'Invalid age.'
    } else {
      if (a < 1) a = 1
      else if (a > 120) a = 120
      form.age = a
    }
  } else if (field === 'heartRate') {
    let hr = parseFloat(form.heartRate)
    if (isNaN(hr)) {
      errorMessage.value = 'Invalid heart rate.'
    } else {
      if (hr < 40) hr = 40
      else if (hr > 180) hr = 180
      form.heartRate = hr
    }
  } else if (field === 'temperature') {
    let t = parseFloat(form.temperature)
    if (isNaN(t)) {
      errorMessage.value = 'Invalid temperature.'
    } else {
      if (t < 35) t = 35
      else if (t > 41) t = 41
      form.temperature = t
    }
  } else if (field === 'oxygenSaturation') {
    let o = parseFloat(form.oxygenSaturation)
    if (isNaN(o)) {
      errorMessage.value = 'Invalid oxygen saturation.'
    } else {
      if (o < 70) o = 70
      else if (o > 100) o = 100
      form.oxygenSaturation = o
    }
  } else if (field === 'respiratoryRate') {
    let rr = parseFloat(form.respiratoryRate)
    if (isNaN(rr)) {
      errorMessage.value = 'Invalid respiratory rate.'
    } else {
      if (rr < 10) rr = 10
      else if (rr > 30) rr = 30
      form.respiratoryRate = rr
    }
  }
  // Blood pressure auto-correction is disabled so that user input is preserved.
}

const addPatient = async () => {
  errorMessage.value = ''
  successMessage.value = ''
  state.value = states.VALIDATING

  // Validate that all fields are provided.
  if (
    !form.name ||
    !form.age ||
    !form.sex ||
    !form.bloodPressure ||
    !form.heartRate ||
    !form.temperature ||
    !form.oxygenSaturation ||
    !form.respiratoryRate
  ) {
    errorMessage.value = 'All fields are required.'
    state.value = states.ERROR
    return
  }

  // Enforce a minimum 10-character name.
  if (form.name.length < 10) {
    errorMessage.value = 'Patient name must be at least 10 characters long.'
    state.value = states.ERROR
    return
  }

  // Auto-correct numeric fields.
  autoCorrect('age')
  autoCorrect('heartRate')
  autoCorrect('temperature')
  autoCorrect('oxygenSaturation')
  autoCorrect('respiratoryRate')
  // Note: bloodPressure auto-correction is disabled.

  // Re-validate numeric fields after auto-correction.
  if (
    parseInt(form.age, 10) < 1 ||
    parseInt(form.age, 10) > 120 ||
    parseFloat(form.heartRate) < 40 ||
    parseFloat(form.heartRate) > 180 ||
    parseFloat(form.temperature) < 35 ||
    parseFloat(form.temperature) > 41 ||
    parseFloat(form.oxygenSaturation) < 70 ||
    parseFloat(form.oxygenSaturation) > 100 ||
    parseFloat(form.respiratoryRate) < 10 ||
    parseFloat(form.respiratoryRate) > 30
  ) {
    errorMessage.value = 'Some fields are still out of range.'
    state.value = states.ERROR
    return
  }

  // Generate password from sanitized name.
  const password = sanitizeNameForPassword(form.name)
  // Generate fake email from name (remove spaces, lowercase).
  const fakeEmail = `${form.name.replace(/\s+/g, '').toLowerCase()}@example.com`

  try {
    state.value = states.REGISTERING
    const userCredential = await createUserWithEmailAndPassword(auth, fakeEmail, password)
    const user = userCredential.user

    await updateProfile(user, { displayName: form.name })

    await setDoc(doc(db, "users", user.uid), {
      username: form.name,
      email: fakeEmail,
      role: "Patient",
      LicenseNo: "N/A",
      age: form.age,
      sex: form.sex,
      bloodPressure: form.bloodPressure,
      heartRate: form.heartRate,
      temperature: form.temperature,
      oxygenSaturation: form.oxygenSaturation,
      respiratoryRate: form.respiratoryRate,
      createdAt: new Date()
    })

    successMessage.value = 'Patient added successfully!'
    state.value = states.SUCCESS

    // Clear the form.
    form.name = ''
    form.age = ''
    form.sex = ''
    form.bloodPressure = ''
    form.heartRate = ''
    form.temperature = ''
    form.oxygenSaturation = ''
    form.respiratoryRate = ''
  } catch (error) {
    errorMessage.value = error.message
    state.value = states.ERROR
  }
}

const statusMessage = computed(() => {
  switch (state.value) {
    case states.IDLE:
      return "Waiting for user input..."
    case states.FILLING:
      return "Filling form..."
    case states.VALIDATING:
      return "Validating inputs..."
    case states.ERROR:
      return "Error: " + errorMessage.value
    case states.REGISTERING:
      return "Registering user..."
    case states.SUCCESS:
      return "Registration successful!"
    default:
      return ""
  }
})

const onFocus = () => {
  if (state.value === states.ERROR) {
    state.value = states.FILLING
  }
}
</script>

<template>
  <div>
    <h1 class="colored-text header-text">Add New Patient</h1>
    <form class="flex-column" @submit.prevent="addPatient">
      <div class="form-group">
        <label for="name">Name:</label>
        <input id="name" type="text" v-model="form.name" @focus="onFocus" placeholder="Name (min. 10 characters)" required />
      </div>
      <div class="form-group">
        <label for="age">Age (years):</label>
        <input id="age" type="number" v-model="form.age" @focus="onFocus" @blur="autoCorrect('age')" placeholder="Age (years)" min="1" max="120" required />
      </div>
      <div class="form-group">
        <label for="sex">Sex:</label>
        <select id="sex" v-model="form.sex" @focus="onFocus" required>
          <option value="" disabled>Select Sex</option>
          <option value="Male">Male</option>
          <option value="Female">Female</option>
        </select>
      </div>
      <div class="form-group">
        <label for="bloodPressure">Blood Pressure:</label>
        <input id="bloodPressure" type="text" v-model="form.bloodPressure" @focus="onFocus" placeholder="Blood Pressure (e.g. 120/80 mmHg)" required />
      </div>
      <div class="form-group">
        <label for="heartRate">Heart Rate (bpm):</label>
        <input id="heartRate" type="number" v-model="form.heartRate" @focus="onFocus" @blur="autoCorrect('heartRate')" placeholder="Heart Rate (bpm)" min="40" max="180" required />
      </div>
      <div class="form-group">
        <label for="temperature">Temperature (°C):</label>
        <input id="temperature" type="number" v-model="form.temperature" @focus="onFocus" @blur="autoCorrect('temperature')" placeholder="Temperature (°C)" min="35" max="41" step="0.1" required />
      </div>
      <div class="form-group">
        <label for="oxygenSaturation">Oxygen Saturation (%):</label>
        <input id="oxygenSaturation" type="number" v-model="form.oxygenSaturation" @focus="onFocus" @blur="autoCorrect('oxygenSaturation')" placeholder="Oxygen Saturation (%)" min="70" max="100" required />
      </div>
      <div class="form-group">
        <label for="respiratoryRate">Respiratory Rate (breaths/min):</label>
        <input id="respiratoryRate" type="number" v-model="form.respiratoryRate" @focus="onFocus" @blur="autoCorrect('respiratoryRate')" placeholder="Respiratory Rate (breaths/min)" min="10" max="30" required />
      </div>
      <button type="submit" :disabled="state === states.REGISTERING || state === states.VALIDATING">
        Add
      </button>
    </form>
    <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>
    <p v-if="successMessage" class="success-message">{{ successMessage }}</p>
    <div class="status-label">{{ statusMessage }}</div>
  </div>
</template>

<style scoped>
.form-group {
  display: flex;
  align-items: center;
  gap: 1em;
  margin-bottom: 0.5em;
}

.form-group label {
  width: 150px;
  text-align: right;
  font-weight: bold;
}

.flex-column {
  display: flex;
  flex-direction: column;
  gap: 1em;
}

form {
  gap: 1em;
}

form input,
form select {
  width: 300px;
  padding: 0.5em;
  box-sizing: border-box;
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
  text-align: center;
  color: red;
}

.success-message {
  text-align: center;
  color: green;
}

label {
    color: var(--primary-color);
}

.status-label {
  text-align: center;
  font-style: italic;
  margin-top: 1em;
  color: #555;
}
</style>
