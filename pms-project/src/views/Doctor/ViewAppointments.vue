<template>
  <div class="appointments-container">
    <h1 class="colored-text">View Appointments</h1>

    <!-- Toolbar for search and filtering -->
    <div class="appointments-toolbar">
      <input
        type="text"
        v-model="searchTerm"
        class="search-bar"
        placeholder="Search appointments..."
      />
      <select v-model="filter" class="filter-select">
        <option value="All">All</option>
        <option value="Upcoming">Upcoming</option>
        <option value="Past">Past</option>
      </select>
    </div>

    <!-- State-based UI rendering -->
    <div v-if="fsm.state === 'loading'">
      <p>Loading appointments…</p>
    </div>
    <div v-else-if="fsm.state === 'error'">
      <p class="error-alert">Error: {{ fsm.error }}</p>
    </div>
    <div v-else-if="fsm.state === 'success'">
      <div v-if="filteredAppointments.length">
        <table class="appointments-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Time</th>
              <th>Reason</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="appt in filteredAppointments" :key="appt.id">
              <td>{{ formatDate(appt.appointmentDate) }}</td>
              <td>{{ formatTime(appt.appointmentTime) }}</td>
              <td>{{ appt.reason }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-else>
        <p>No appointments found.</p>
      </div>
    </div>
    <div v-else>
      <p>Initializing…</p>
    </div>
  </div>
</template>

<script>
import { ref, computed, reactive, onMounted, onUnmounted } from "vue";
import {
  collection,
  query,
  where,
  onSnapshot
} from "firebase/firestore";
import { auth, db } from "../../firebase";

export default {
  name: "ViewAppointments",
  setup() {
    // Finite state machine for predictable view states.
    const fsm = reactive({
      state: "idle", // possible states: 'idle', 'loading', 'success', 'error'
      error: null,
    });

    // Reactive state for appointments and search/filter controls.
    const appointments = ref([]);
    const searchTerm = ref("");
    const filter = ref("All");

    // Transition helper for automata states.
    function transition(newState, error = null) {
      fsm.state = newState;
      fsm.error = error;
    }

    // Validate a date value.
    const isValidDate = (date) => {
      const d = new Date(date);
      return !isNaN(d.getTime());
    };

    // Format a date (Firestore timestamp or other date formats) with auto‑correction.
    const formatDate = (date) => {
      if (!date) return "N/A";
      let d =
        typeof date === "object" && date.seconds
          ? new Date(date.seconds * 1000)
          : new Date(date);
      if (isNaN(d.getTime())) {
        // Auto‑correction: fallback to current date.
        d = new Date();
      }
      return d.toLocaleDateString();
    };

    // Format time – if not in HH:MM format, tries to reformat or returns "N/A".
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
      let t = time.toString();
      if (!/^\d{2}:\d{2}$/.test(t)) {
        const parts = t.split(/[\s:.-]/);
        if (parts.length >= 2) {
          t = parts[0].padStart(2, "0") + ":" + parts[1].padStart(2, "0");
        } else {
          t = "N/A";
        }
      }
      return t;
    };

    // Computed property to filter appointments based on search term and filter selection.
    const filteredAppointments = computed(() => {
      return appointments.value.filter((appt) => {
        // Search filtering (based on the reason). Adjust if you need to search by date/time too.
        const matchesSearch = appt.reason
          .toLowerCase()
          .includes(searchTerm.value.toLowerCase());

        // Filter appointments by their date.
        let matchesFilter = true;
        if (filter.value !== "All") {
          // Get a Date object (whether stored as a Firestore timestamp or a Date)
          let apptDate =
            typeof appt.appointmentDate === "object" && appt.appointmentDate.seconds
              ? new Date(appt.appointmentDate.seconds * 1000)
              : new Date(appt.appointmentDate);
          const today = new Date();
          today.setHours(0, 0, 0, 0); // compare only date parts
          if (filter.value === "Upcoming") {
            matchesFilter = apptDate >= today;
          } else if (filter.value === "Past") {
            matchesFilter = apptDate < today;
          }
        }
        return matchesSearch && matchesFilter;
      });
    });

    // Store unsubscribe functions for real‑time listeners.
    const unsubscribers = [];

    // Setup real‑time listeners using Firestore's onSnapshot.
    const setupListeners = (user) => {
      transition("loading");

      // Appointments query (only appointments for the current doctor)
      const appointmentsRef = collection(db, "appointments");
      const appointmentsQuery = query(
        appointmentsRef,
        where("doctorId", "==", user.uid)
      );
      const unsubscribeAppointments = onSnapshot(
        appointmentsQuery,
        (snapshot) => {
          const data = [];
          snapshot.forEach((doc) => {
            const d = doc.data();
            // Validate and auto-correct the appointment date.
            let appointmentDate = d.appointmentDate;
            if (!appointmentDate || !isValidDate(appointmentDate)) {
              appointmentDate = new Date();
            }
            // Rely on formatTime for appointmentTime auto‑correction.
            data.push({
              id: doc.id,
              appointmentDate,
              appointmentTime: d.appointmentTime,
              reason: d.reason || "No reason provided",
            });
          });
          appointments.value = data;
          transition("success");
        },
        (error) => {
          console.error("Error fetching appointments:", error);
          transition("error", error.message);
        }
      );
      unsubscribers.push(unsubscribeAppointments);
    };

    // Wait for authentication before setting up realtime listeners.
    onMounted(() => {
      const authUnsub = auth.onAuthStateChanged((user) => {
        if (user) {
          setupListeners(user);
        } else {
          transition("error", "User not authenticated.");
        }
      });
      unsubscribers.push(authUnsub);
    });

    onUnmounted(() => {
      unsubscribers.forEach((unsub) => unsub());
    });

    return {
      searchTerm,
      filter,
      appointments,
      fsm,
      filteredAppointments,
      formatDate,
      formatTime,
    };
  },
};
</script>

<style scoped>
/* Container styling mimicking the provided design */
.appointments-container {
  max-width: 1200px;
  margin: 20px auto;
  background-color: #fff;
  padding: 20px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  border-radius: 6px;
}

/* Page header */
.colored-text {
  text-align: center;
  color: var(--primary-color, #007bff);
  margin-bottom: 20px;
}

/* Toolbar with search bar and filter dropdown */
.appointments-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.search-bar,
.filter-select {
  padding: 8px 12px;
  font-size: 1rem;
  border: 1px solid #ccc;
  border-radius: 4px;
}

/* Table styling inspired by your image */
.appointments-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 10px;
}

.appointments-table th,
.appointments-table td {
  border: 1px solid #ddd;
  padding: 12px 15px;
  text-align: left;
}

.appointments-table th {
  background-color: #f8f9fa;
  font-weight: 600;
}

/* Error message style */
.error-alert {
  color: red;
  font-weight: bold;
}
</style>
