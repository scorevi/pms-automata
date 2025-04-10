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

// Reactive form data for a new patient - Added medicalCondition
const form = reactive({
  name: '',
  age: '',
  sex: '',
  medicalCondition: '', // <-- Added Medical Condition field
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

  // Validate that all fields are provided - Added medicalCondition check
  if (
    !form.name ||
    !form.age ||
    !form.sex ||
    !form.medicalCondition || // <-- Added validation check
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
    errorMessage.value = 'Some numeric fields are still out of range after auto-correction.'
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

    // Added medicalCondition to the Firestore document
    await setDoc(doc(db, "users", user.uid), {
      username: form.name,
      email: fakeEmail,
      role: "Patient",
      LicenseNo: "N/A", // Assuming LicenseNo is not applicable for Patients
      age: form.age,
      sex: form.sex,
      medicalCondition: form.medicalCondition, // <-- Added to Firestore data
      bloodPressure: form.bloodPressure,
      heartRate: form.heartRate,
      temperature: form.temperature,
      oxygenSaturation: form.oxygenSaturation,
      respiratoryRate: form.respiratoryRate,
      createdAt: new Date()
    })

    successMessage.value = 'Patient added successfully!'
    state.value = states.SUCCESS

    // Clear the form - Added medicalCondition reset
    form.name = ''
    form.age = ''
    form.sex = ''
    form.medicalCondition = '' // <-- Clear medical condition field
    form.bloodPressure = ''
    form.heartRate = ''
    form.temperature = ''
    form.oxygenSaturation = ''
    form.respiratoryRate = ''

  } catch (error) {
    if (error.code === 'auth/email-already-in-use') {
        errorMessage.value = 'A patient profile potentially already exists with a similar name. Please check the patient list or modify the name slightly.';
    } else {
        errorMessage.value = `Registration failed: ${error.message}`;
    }
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
  // Clear error/success messages when user starts typing again
  errorMessage.value = ''
  successMessage.value = ''
  if (state.value === states.ERROR || state.value === states.SUCCESS || state.value === states.IDLE) {
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
        <input id="name" type="text" v-model.trim="form.name" @focus="onFocus" placeholder="Full Name (min. 10 characters)" required />
      </div>
      <div class="form-group">
        <label for="age">Age (years):</label>
        <input id="age" type="number" v-model="form.age" @focus="onFocus" @blur="autoCorrect('age')" placeholder="Age (1-120)" min="1" max="120" required />
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
        <label for="medicalCondition">Medical Condition(s):</label>
        <textarea id="medicalCondition" v-model.trim="form.medicalCondition" @focus="onFocus" placeholder="List any relevant medical conditions" rows="3" required></textarea>
      </div>
      <div class="form-group">
        <label for="bloodPressure">Blood Pressure:</label>
        <input id="bloodPressure" type="text" v-model.trim="form.bloodPressure" @focus="onFocus" placeholder="e.g., 120/80 mmHg" required />
      </div>
      <div class="form-group">
        <label for="heartRate">Heart Rate (bpm):</label>
        <input id="heartRate" type="number" v-model="form.heartRate" @focus="onFocus" @blur="autoCorrect('heartRate')" placeholder="Heart Rate (40-180 bpm)" min="40" max="180" required />
      </div>
      <div class="form-group">
        <label for="temperature">Temperature (°C):</label>
        <input id="temperature" type="number" v-model="form.temperature" @focus="onFocus" @blur="autoCorrect('temperature')" placeholder="Temperature (35-41 °C)" min="35" max="41" step="0.1" required />
      </div>
      <div class="form-group">
        <label for="oxygenSaturation">Oxygen Saturation (%):</label>
        <input id="oxygenSaturation" type="number" v-model="form.oxygenSaturation" @focus="onFocus" @blur="autoCorrect('oxygenSaturation')" placeholder="SpO2 (70-100%)" min="70" max="100" required />
      </div>
      <div class="form-group">
        <label for="respiratoryRate">Respiratory Rate (breaths/min):</label>
        <input id="respiratoryRate" type="number" v-model="form.respiratoryRate" @focus="onFocus" @blur="autoCorrect('respiratoryRate')" placeholder="Breaths/min (10-30)" min="10" max="30" required />
      </div>

      <button type="submit" :disabled="state === states.REGISTERING || state === states.VALIDATING">
        Add Patient
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
  /* Consider removing align-items: center if labels should top-align with taller inputs like textarea */
  /* align-items: center; */
  align-items: flex-start; /* Align labels to the top */
  gap: 1em;
  margin-bottom: 0.75em; /* Increased spacing slightly */
}

.form-group label {
  width: 150px;
  text-align: right;
  font-weight: bold;
  padding-top: 0.5em; /* Add padding to align vertically with input border */
  color: var(--primary-color); /* Use theme color */
}

.flex-column {
  display: flex;
  flex-direction: column;
  gap: 0; /* Remove gap here, handled by form-group margin */
}

form {
  /* Remove gap from form, rely on form-group margin */
}

form input,
form select,
form textarea { /* Added textarea */
  flex-grow: 1; /* Allow inputs/textarea to take remaining space */
  max-width: 400px; /* Optional: Limit max width */
  /* Use global styles for inputs/selects/textareas if defined */
  /* Assuming global.css handles padding, border, etc. */
   box-sizing: border-box;
   /* Example styles if not fully covered by global.css */
   /* padding: calc(var(--spacing-base) * 1.25) calc(var(--spacing-base) * 1.5);
   border: 1px solid var(--border-color);
   border-radius: var(--border-radius-medium);
   line-height: 1.5; */
}

/* Ensure textarea specific styles if needed */
form textarea {
    resize: vertical; /* Allow vertical resize */
    min-height: 60px; /* Set a minimum height */
}


button {
  /* Assuming button styles are handled globally or keeping existing ones */
  padding: 0.75em 1.5em; /* Adjusted padding */
  font-size: 1em;
  /* background-color: var(--primary-color, #007bff);
  color: white;
  border: none;
  border-radius: 4px; */
  cursor: pointer;
  align-self: center; /* Center button */
  margin-top: 1em; /* Add margin above button */
}

button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.error-message {
  text-align: center;
  color: red;
  margin-top: 1em;
}

.success-message {
  text-align: center;
  color: green;
  margin-top: 1em;
}

.status-label {
  text-align: center;
  font-style: italic;
  margin-top: 1em;
  color: #555;
}

/* Adjust header style if needed */
.header-text {
    margin-bottom: 1.5em; /* More space below header */
    /* font-size: 1.75rem; */ /* Already defined in global? */
    /* font-weight: 700; */ /* Already defined in global? */
}
</style>