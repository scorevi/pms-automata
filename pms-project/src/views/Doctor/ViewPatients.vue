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
  SEARCHING: 'searching' // Retained state, though not explicitly used in status message below
}

const state = ref(states.IDLE)
const error = ref('')
const patients = ref([])

// Reactive search variables.
const searchQuery = ref('')
// Added 'Urgency' to search criteria options
const searchCriteria = ref('Name') // Options: 'Name', 'Medical Condition', 'Urgency'

// Computed search status message.
const searchStatus = computed(() => {
  // Indicate searching when query is present
  if (searchQuery.value) {
     // Set state to SEARCHING when query changes (optional, depends on desired UX)
     // state.value = states.SEARCHING; // Uncomment if you want state change on typing
    return `Searching for "${searchQuery.value}" by ${searchCriteria.value}`
  } else {
    // Revert state if query is cleared (optional)
    // if (state.value === states.SEARCHING) state.value = states.SUCCESS; // Uncomment if using state change
    return 'Idle'
  }
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
      // Ensure urgency exists; default to 'N/A' if missing.
      if (!data.urgency) data.urgency = 'N/A' // Added default for urgency
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

  // Filter based on selected criteria
  if (searchCriteria.value === 'Name') {
    return patients.value.filter(patient =>
      patient.username && patient.username.toLowerCase().includes(q)
    )
  } else if (searchCriteria.value === 'Medical Condition') {
    return patients.value.filter(patient =>
      // Ensure medicalCondition exists before trying to access it
      patient.medicalCondition && patient.medicalCondition.toLowerCase().includes(q)
    )
  } else if (searchCriteria.value === 'Urgency') { // Added Urgency filter logic
     return patients.value.filter(patient =>
      // Ensure urgency exists before trying to access it
      patient.urgency && patient.urgency.toLowerCase().includes(q)
    )
  }

  // Fallback: return all patients if criteria doesn't match (should not happen with select)
  return patients.value
})

// Helper function to get the CSS class based on urgency level
const getUrgencyClass = (urgency) => {
  if (!urgency) return ''; // Return empty if urgency is null or undefined
  switch (urgency.toLowerCase()) {
    case 'emergency':
      return 'vital-high';
    case 'urgent':
      return 'vital-low';
    case 'non urgent': // Handle case variations if necessary
    case 'non-urgent':
      return 'vital-normal';
    default:
      return ''; // No specific class for 'N/A' or other values
  }
}

// Helper function to apply class based on vital sign value
const getVitalClass = (field, value) => {
  if (value == null || value === '') return '';

  switch (field) {
    case 'bloodPressure': {
      const [systolic, diastolic] = value.split('/').map(v => parseInt(v.trim()));
      if (isNaN(systolic) || isNaN(diastolic)) return '';
      if (systolic < 90 || diastolic < 60) return 'vital-low';
      if (systolic > 140 || diastolic > 90) return 'vital-high';
      return 'vital-normal';
    }

    case 'heartRate': {
      const hr = parseInt(value);
      if (hr < 60) return 'vital-low';
      if (hr > 100) return 'vital-high';
      return 'vital-normal';
    }

    case 'temperature': {
      const temp = parseFloat(value);
      if (temp < 36.1) return 'vital-low';
      if (temp > 37.8) return 'vital-high';
      return 'vital-normal';
    }

    case 'oxygenSaturation': {
      const spo2 = parseInt(value);
      if (spo2 < 95) return 'vital-low';
      return 'vital-normal';
    }

    case 'respiratoryRate': {
      const rr = parseInt(value);
      if (rr < 12) return 'vital-low';
      if (rr > 20) return 'vital-high';
      return 'vital-normal';
    }

    default:
      return '';
  }
}

</script>

<template>
  <div>
    <h1 class="colored-text">View My Patients</h1>

    <div class="search-container">
      <label for="searchQuery">Search:</label>
      <input id="searchQuery" type="text" v-model="searchQuery" placeholder="Enter search query" />
      <label for="searchCriteria">Filter by:</label>
      <select id="searchCriteria" v-model="searchCriteria">
        <option value="Name">Name</option>
        <option value="Medical Condition">Medical Condition</option>
        <option value="Urgency">Urgency</option> </select>
      <div class="search-status">{{ searchStatus }}</div>
    </div>

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
            <th>Urgency</th> <th>Blood Pressure</th>
            <th>Heart Rate</th>
            <th>Temperature</th>
            <th>Oxygen Saturation</th>
            <th>Respiratory Rate</th>
            <th>Medical Condition</th>
            <th>Created At</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="filteredPatients.length === 0">
             <td :colspan="12" style="text-align: center;">No patients match your search criteria.</td> </tr>
           <tr v-for="patient in filteredPatients" :key="patient.id">
            <td>{{ patient.username }}</td>
            <td>{{ patient.email }}</td>
            <td>{{ patient.age }}</td>
            <td>{{ patient.sex }}</td>
            <td :class="getUrgencyClass(patient.urgency)">
              <span class="urgency-text">{{ patient.urgency }}</span>
            </td>
            <td :class="getVitalClass('bloodPressure', patient.bloodPressure)">{{ patient.bloodPressure }}</td>
            <td :class="getVitalClass('heartRate', patient.heartRate)">{{ patient.heartRate }}</td>
            <td :class="getVitalClass('temperature', patient.temperature)">{{ patient.temperature }}</td>
            <td :class="getVitalClass('oxygenSaturation', patient.oxygenSaturation)">{{ patient.oxygenSaturation }}</td>
            <td :class="getVitalClass('respiratoryRate', patient.respiratoryRate)">{{ patient.respiratoryRate }}</td>
            <td>{{ patient.medicalCondition || 'N/A' }}</td> <td>{{ patient.createdAt ? patient.createdAt.toLocaleString() : 'N/A' }}</td> </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
/* Search Container */
.search-container {
  display: flex;
  flex-wrap: wrap; /* Allow items to wrap on smaller screens */
  align-items: center;
  gap: 1em; /* Spacing between elements */
  margin-bottom: 1.5em; /* Increased bottom margin */
  padding: 1em; /* Add some padding */
  background-color: var(--surface-color, #f8f9fa); /* Use variable or fallback */
  border-radius: var(--border-radius-medium, 8px); /* Use variable or fallback */
  box-shadow: 0 1px 3px rgba(0,0,0,0.05); /* Subtle shadow */
}

.search-container label {
  font-weight: bold;
  margin-right: 0.5em; /* Space after label */
}

.search-container input[type="text"],
.search-container select {
  padding: 0.5em 0.75em; /* Adjust padding */
  border: 1px solid var(--border-color, #ccc);
  border-radius: var(--border-radius-small, 4px);
  min-width: 150px; /* Ensure decent width */
  flex-grow: 1; /* Allow input/select to grow */
  max-width: 300px; /* Prevent excessive width */
}

.search-status {
  font-style: italic;
  color: var(--text-muted-color, #555); /* Use variable or fallback */
  margin-left: auto; /* Push status to the right if space allows */
  white-space: nowrap; /* Prevent status text wrapping */
}

/* Table container: Only the table scrolls horizontally if needed */
.table-container {
  max-width: 100%;
  overflow-x: auto; /* Enable horizontal scroll *on the container* */
  box-sizing: border-box;
}

/* Table styling */
table {
  width: 100%;
  min-width: 950px; /* Adjusted min-width to better accommodate the new column */
  border-collapse: collapse;
  /* margin-top: 1em; Removed margin as search container provides spacing */
  background-color: var(--background-color, #fff); /* Use variable or fallback */
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05); /* Subtle shadow */
  border: 1px solid var(--border-color, #e0e0e0); /* Add subtle table border */
  border-radius: var(--border-radius-medium, 8px); /* Rounded corners for the table */
  overflow: hidden; /* Ensures border-radius applies to children */
}

th, td {
  text-align: left;
  padding: 12px 16px; /* Consistent padding */
  border-bottom: 1px solid var(--border-color, #e0e0e0); /* Use variable */
  white-space: nowrap; /* Prevent cell content wrapping */
  vertical-align: middle; /* Align cell content vertically */
}

/* Remove border from the last row */
tbody tr:last-child td {
    border-bottom: none;
}

th {
  background-color: var(--primary-color, #6A0DAD); /* Use updated primary color variable */
  color: white;
  font-weight: 600; /* Slightly bolder header */
}

/* Alternating row colors */
tr:nth-child(even) {
  background-color: var(--surface-color, #f9f9f9); /* Use variable */
}

tr:hover {
  background-color: var(--secondary-color, #f1f1f1); /* Use variable */
}

/* --- Urgency Color Styling --- */
/* Common styling for the urgency text span inside the cell */
.urgency-text {
  display: inline-block; /* Allows padding and border-radius */
  padding: 4px 8px; /* Add padding to create a badge effect */
  border-radius: var(--border-radius-small, 4px); /* Rounded corners for the badge */
  font-weight: 500; /* Slightly bolder text */
  text-align: center;
  min-width: 80px; /* Ensure badges have a minimum width */
}

/* Class applied to the TD for background */
td.urgency-emergency .urgency-text {
  background-color: #f8d7da; /* Light red background */
  color: #721c24; /* Dark red text */
  border: 1px solid #f5c6cb; /* Optional: Subtle border */
}

td.urgency-urgent .urgency-text {
  background-color: #fff3cd; /* Light orange/yellow background */
  color: #856404; /* Dark yellow/brown text */
  border: 1px solid #ffeeba; /* Optional: Subtle border */
}

td.urgency-non-urgent .urgency-text {
  background-color: #d4edda; /* Light green background */
  color: #155724; /* Dark green text */
  border: 1px solid #c3e6cb; /* Optional: Subtle border */
}
/* --- End Urgency Color Styling --- */


/* Info/Error Messages */
.info-message {
  margin-top: 1em;
  padding: 1em;
  background-color: #e7f3fe; /* Light blue background */
  border: 1px solid #d0eaff;
  color: #0c5464; /* Darker blue text */
  border-radius: var(--border-radius-medium, 4px);
}

.error-message {
  margin-top: 1em;
  padding: 1em;
  background-color: #f8d7da; /* Light red background */
  border: 1px solid #f5c6cb;
  color: #721c24; /* Darker red text */
  border-radius: var(--border-radius-medium, 4px);
}

/* Styles for the main heading */
.colored-text {
    color: var(--primary-color, #6A0DAD); /* Ensure heading uses primary color */
    margin-bottom: 1em; /* Add space below heading */
}

/* Remove default body scroll prevention if not needed globally */
/* html, body {
  overflow-x: hidden;
} */
 /* Color codes for vitals */
td.vital-high {
  background-color: #f8d7da; /* Light red */
  color: #721c24;
  font-weight: bold;
}

td.vital-low {
  background-color: #fff3cd; /* Light yellow */
  color: #856404;
  font-weight: bold;
}

td.vital-normal {
  background-color: #d4edda; /* Light green */
  color: #155724;
  font-weight: bold;
}

</style>