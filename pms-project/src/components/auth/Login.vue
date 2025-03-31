<script setup>
import { ref, reactive, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { signInWithEmailAndPassword } from "firebase/auth";
import { getDoc, doc } from "firebase/firestore";
import { auth, db } from "../../firebase"; // Adjust path as needed
import Cookies from "js-cookie";

const router = useRouter();

// Immediately check on mount if the user is already logged in
onMounted(() => {
  if (Cookies.get("loggedIn") === "true") {
    const userRole = Cookies.get("userRole"); // "Doctor" or "Patient"
    if (userRole === "Doctor") {
      router.push("/DoctorView/DoctorDashboard");
    } else if (userRole === "Patient") {
      router.push("/PatientView/PatientDashboard");
    }
  }
});

// Define automata states
const states = {
  IDLE: "idle",
  FILLING: "filling",
  VALIDATING: "validating",
  ERROR: "error",
  LOGGING_IN: "loggingIn",
  SUCCESS: "success",
};

const state = ref(states.IDLE);
const errorMessage = ref("");

// Reactive form data
const form = reactive({
  username: "",
  password: "",
});

// Update a given form field and set state to FILLING if currently idle
const updateField = (field, event) => {
  form[field] = event.target.value;
  if (state.value === states.IDLE) {
    state.value = states.FILLING;
  }
};

// When any field is focused, if in error, switch back to filling.
const onFocus = () => {
  if (state.value === states.ERROR) {
    state.value = states.FILLING;
  }
};

const login = async () => {
  state.value = states.VALIDATING;
  errorMessage.value = "";
  
  // Basic validation: both fields must be provided
  if (!form.username || !form.password) {
    errorMessage.value = "Both username and password are required.";
    state.value = states.ERROR;
    return;
  }
  
  // Generate fake email from username (e.g. john@example.com)
  const fakeEmail = `${form.username}@example.com`;
  
  try {
    state.value = states.LOGGING_IN;
    const userCredential = await signInWithEmailAndPassword(auth, fakeEmail, form.password);
    const user = userCredential.user;
    
    // Fetch user profile from Firestore to determine occupation
    const userDoc = await getDoc(doc(db, "users", user.uid));
    if (!userDoc.exists()) {
      errorMessage.value = "User profile not found.";
      state.value = states.ERROR;
      return;
    }
    
    const userData = userDoc.data();
    state.value = states.SUCCESS;
    
    // Set cookies for session and user role (expires in 1 hour)
    Cookies.set("loggedIn", "true", { expires: 1/24 });
    Cookies.set("lastActivity", Date.now(), { expires: 1/24 });
    Cookies.set("userRole", userData.role, { expires: 1/24 });
    Cookies.set("licenseNumber", userData.LicenseNo, { expires: 1/24 });
    
    // Redirect based on user's occupation (role)
    if (userData.role === "Doctor") {
      router.push("/DoctorView/DoctorDashboard");
    } else if (userData.role === "Patient") {
      router.push("/PatientView/PatientDashboard");
    } else {
      // Fallback if role is not recognized
      router.push("/PatientView/PatientDashboard");
    }
  } catch (error) {
    errorMessage.value = error.message;
    state.value = states.ERROR;
  }
};

const statusMessage = computed(() => {
  switch (state.value) {
    case states.IDLE:
      return "Waiting for user input...";
    case states.FILLING:
      return "Filling form...";
    case states.VALIDATING:
      return "Validating inputs...";
    case states.ERROR:
      return "Error: " + errorMessage.value;
    case states.LOGGING_IN:
      return "Logging in...";
    case states.SUCCESS:
      return "Login successful!";
    default:
      return "";
  }
});

const navigateRegister = () => {
  router.push("/register");
};
</script>

<template>
  <div class="container flex-column">
    <div class="login-container flex-column">
      <div class="login-form flex-column">
        <h1>Login</h1>
        <form class="flex-column" @submit.prevent="login">
          <input
            :value="form.username"
            @input="updateField('username', $event)"
            @focus="onFocus"
            type="text"
            placeholder="Username"
            autocomplete="new-password"
          />
          <input
            :value="form.password"
            @input="updateField('password', $event)"
            @focus="onFocus"
            type="password"
            placeholder="Password"
            autocomplete="new-password"
          />
          <!-- By having the button inside the form with type="submit", pressing Enter will trigger the form submission -->
          <button type="submit">Login</button>
        </form>
        <p v-if="errorMessage" style="color: red;">{{ errorMessage }}</p>
        <span @click="navigateRegister">Create an Account</span>
      </div>
    </div>
    <div class="status-label">{{ statusMessage }}</div>
  </div>
</template>

<style scoped>
.container {
  width: 100vw;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4em;
  box-sizing: border-box;
  background-color: #F0F5FA;
}

.login-container {
  width: 100%;
  height: 100%;
  display: flex;
  gap: 1em;
  align-items: center;
  justify-content: center;
  background-color: #FFF;
  border-radius: 1em;
}

.login-form {
  width: 300px;
  height: auto;
}

.login-form h1 {
  text-align: center;
  color: var(--primary-color);
  margin-bottom: 2em;
}

.login-form form {
  display: flex;
  flex-direction: column;
  gap: 1em;
  margin-bottom: 2em;
}

button {
  margin-bottom: 1em;
}

span {
  text-align: center;
  color: var(--primary-color);
  cursor: pointer;
}

.status-label {
  position: fixed;
  bottom: 10px;
  left: 10px;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 8px 12px;
  font-size: 14px;
  border-radius: 5px;
}
</style>
