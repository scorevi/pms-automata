<script setup>
import { ref, onMounted, computed } from 'vue'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '../../firebase' // Adjust the path as needed

// Automata states for the module.
const states = {
  IDLE: 'idle',
  LOADING: 'loading',
  ERROR: 'error',
  SUCCESS: 'success',
  SEARCHING: 'searching'
}

const state = ref(states.IDLE)
const error = ref('')
const patients = ref([])

// Reactive search variables.
const searchQuery = ref('')
const searchCriteria = ref('Name') // Options: 'Name', 'Medical Condition'

// Computed search status message.
const searchStatus = computed(() => {
  return searchQuery.value
    ? `Searching for "${searchQuery.value}" by ${searchCriteria.value}`
    : 'Idle'
})

// Fetch patients from Firestore (only patients with role "Patient").
const fetchPatients = async () => {
  state.value = states.LOADING
  error.value = ''
  try {
    const q = query(collection(db, 'users'), where('role', '==', 'Patient'))
    const querySnapshot = await getDocs(q)
    patients.value = querySnapshot.docs.map(docSnap => {
      const data = docSnap.data()
      // Ensure medicalCondition exists; default to empty string if missing.
      if (!data.medicalCondition) data.medicalCondition = ''
      // Convert createdAt Firestore Timestamp to JS Date if needed.
      if (data.createdAt && data.createdAt.seconds) {
        data.createdAt = new Date(data.createdAt.seconds * 1000)
      }
      return { id: docSnap.id, ...data }
    })
    state.value = states.SUCCESS
  } catch (err) {
    error.value = err.message
    state.value = states.ERROR
  }
}

onMounted(() => {
  fetchPatients()
})

// Computed property to filter patients based on search query and criterion.
const filteredPatients = computed(() => {
  if (!searchQuery.value) return patients.value

  const q = searchQuery.value.toLowerCase().trim()
  if (searchCriteria.value === 'Name') {
    return patients.value.filter(patient =>
      patient.username && patient.username.toLowerCase().includes(q)
    )
  } else if (searchCriteria.value === 'Medical Condition') {
    return patients.value.filter(patient =>
      patient.medicalCondition && patient.medicalCondition.toLowerCase().includes(q)
    )
  }
  return patients.value
})
</script>

<template>
  <div>
    <h1 class="colored-text">View My Patients</h1>
    
    <!-- Search & Filter Section -->
    <div class="search-container">
      <label for="searchQuery">Search:</label>
      <input id="searchQuery" type="text" v-model="searchQuery" placeholder="Enter search query" />
      <label for="searchCriteria">Filter by:</label>
      <select id="searchCriteria" v-model="searchCriteria">
        <option value="Name">Name</option>
        <option value="Medical Condition">Medical Condition</option>
      </select>
      <div class="search-status">{{ searchStatus }}</div>
    </div>
    
    <!-- Display Loading, Error or Table -->
    <div v-if="state === states.LOADING" class="info-message">Loading patients...</div>
    <div v-else-if="state === states.ERROR" class="error-message">{{ error }}</div>
    <div v-else class="table-container">
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Age</th>
            <th>Sex</th>
            <th>Blood Pressure</th>
            <th>Heart Rate</th>
            <th>Temperature</th>
            <th>Oxygen Saturation</th>
            <th>Respiratory Rate</th>
            <th>Medical Condition</th>
            <th>Created At</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="patient in filteredPatients" :key="patient.id">
            <td>{{ patient.username }}</td>
            <td>{{ patient.email }}</td>
            <td>{{ patient.age }}</td>
            <td>{{ patient.sex }}</td>
            <td>{{ patient.bloodPressure }}</td>
            <td>{{ patient.heartRate }}</td>
            <td>{{ patient.temperature }}</td>
            <td>{{ patient.oxygenSaturation }}</td>
            <td>{{ patient.respiratoryRate }}</td>
            <td>{{ patient.medicalCondition }}</td>
            <td>{{ patient.createdAt ? patient.createdAt.toLocaleString() : '' }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
/* Search Container */
.search-container {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 1em;
  margin-bottom: 1em;
}

.search-container label {
  font-weight: bold;
}

.search-status {
  font-style: italic;
  color: #555;
}

/* Table container: Only the table scrolls horizontally if needed */
.table-container {
  max-width: 100%;
  overflow-x: auto;
  box-sizing: border-box;
}

/* Table styling */
table {
  width: 100%;
  min-width: 800px; /* Adjust based on your number of columns */
  border-collapse: collapse;
  margin-top: 1em;
  background-color: #fff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

th, td {
  text-align: left;
  padding: 12px 16px;
  border-bottom: 1px solid #e0e0e0;
}

th {
  background-color: var(--primary-color, #4CAF50);
  color: white;
}

tr:nth-child(even) {
  background-color: #f9f9f9;
}

tr:hover {
  background-color: #f1f1f1;
}

/* Info/Error Messages */
.info-message {
  margin-top: 1em;
  color: #333;
}

.error-message {
  margin-top: 1em;
  color: red;
}

/* Prevent horizontal scroll on the whole page */
html, body {
  overflow-x: hidden;
}
</style>
