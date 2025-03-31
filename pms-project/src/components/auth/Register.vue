<script setup>
import { ref, reactive, computed } from "vue";
import { useRouter } from "vue-router";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "../../firebase"; // Ensure this path is correct
import Cookies from "js-cookie";

const router = useRouter();

const roles = ["Doctor", "Patient"];

const states = {
  IDLE: "idle",
  FILLING: "filling",
  VALIDATING: "validating",
  ERROR: "error",
  REGISTERING: "registering",
  SUCCESS: "success",
};

const state = ref(states.IDLE);
const focusedCount = ref(0); // Tracks how many input elements are focused

const form = reactive({
  username: "",
  // Email is hidden; we generate a fake email for registration.
  password: "",
  confirmPassword: "",
  selectedRole: "",
  licenseNumber: "",
});

const errorMessage = ref("");

// Update a form field and set state to FILLING if currently idle.
const updateField = (field, event) => {
  form[field] = event.target.value;
  if (state.value === states.IDLE) {
    state.value = states.FILLING;
  }
};

// Called on focus of any input or select field.
const onFocus = () => {
  if (state.value === states.ERROR) {
    state.value = states.FILLING;
  }
  focusedCount.value++;
};

// Called on blur of any input or select field.
const onBlur = () => {
  focusedCount.value--;
  if (focusedCount.value <= 0) {
    state.value = states.IDLE;
  }
};

const register = async () => {
  state.value = states.VALIDATING;
  errorMessage.value = "";

  // Validate required fields.
  if (
    !form.username ||
    !form.password ||
    !form.confirmPassword ||
    !form.selectedRole
  ) {
    errorMessage.value = "All fields are required.";
    state.value = states.ERROR;
    return;
  }

  if (form.password !== form.confirmPassword) {
    errorMessage.value = "Passwords do not match.";
    state.value = states.ERROR;
    return;
  }

  if (form.selectedRole === "Doctor" && !form.licenseNumber) {
    errorMessage.value = "License number is required for doctors.";
    state.value = states.ERROR;
    return;
  }

  try {
    state.value = states.REGISTERING;
    // Generate a fake email using the username.
    const fakeEmail = `${form.username}@example.com`;
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      fakeEmail,
      form.password
    );
    const user = userCredential.user;

    await updateProfile(user, { displayName: form.username });

    await setDoc(doc(db, "users", user.uid), {
      username: form.username,
      email: fakeEmail,
      role: form.selectedRole,
      LicenseNo: form.licenseNumber,
      createdAt: new Date(),
    });

    alert("Registration successful!");
    state.value = states.SUCCESS;

    // Set cookies upon successful registration.
    Cookies.set("loggedIn", "true", { expires: 1/24 }); // 1 hour
    Cookies.set("lastActivity", Date.now(), { expires: 1/24 });

    // Redirect based on the role.
    if (form.selectedRole === "Doctor") {
      router.push("/DoctorView/DoctorDashboard");
    } else if (form.selectedRole === "Patient") {
      router.push("/PatientView/PatientDashboard");
    } else {
      router.push("/");
    }
  } catch (error) {
    errorMessage.value = error.message;
    console.error("Firebase Error:", error);
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
    case states.REGISTERING:
      return "Registering user...";
    case states.SUCCESS:
      return "Registration successful!";
    default:
      return "";
  }
});

const navigateLogin = () => {
  router.push("/");
};
</script>

<template>
  <div class="container flex-column">
    <div class="login-container flex-column">
      <div class="login-form flex-column">
        <h1>Register</h1>
        <!-- Wrap your inputs in a form with @submit.prevent -->
        <form class="flex-column" @submit.prevent="register">
          <input
            :value="form.username"
            @input="updateField('username', $event)"
            @focus="onFocus"
            @blur="onBlur"
            type="text"
            placeholder="Username"
            autocomplete="new-password"
          />
          <!-- Email input is removed from UI -->

          <select
            :value="form.selectedRole"
            @input="updateField('selectedRole', $event)"
            @focus="onFocus"
            @blur="onBlur"
            name="roles"
            id="roles"
            autocomplete="new-password"
          >
            <option value="" disabled>Select Occupation</option>
            <option v-for="role in roles" :key="role" :value="role">
              {{ role }}
            </option>
          </select>

          <!-- License Number field only shows for "Doctor" -->
          <div v-if="form.selectedRole === 'Doctor'">
            <input
              :value="form.licenseNumber"
              @input="updateField('licenseNumber', $event)"
              @focus="onFocus"
              @blur="onBlur"
              type="text"
              placeholder="License number"
              autocomplete="new-password"
            />
          </div>

          <input
            :value="form.password"
            @input="updateField('password', $event)"
            @focus="onFocus"
            @blur="onBlur"
            type="password"
            placeholder="Password"
            autocomplete="new-password"
          />
          <input
            :value="form.confirmPassword"
            @input="updateField('confirmPassword', $event)"
            @focus="onFocus"
            @blur="onBlur"
            type="password"
            placeholder="Confirm Password"
            autocomplete="new-password"
          />
          <button type="submit">Register</button>
        </form>
        <p v-if="errorMessage" style="color: red; margin-bottom: 1em; text-align: center;">{{ errorMessage }}</p>
        <span @click="navigateLogin">Already have an account?</span>
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

@media screen and (max-width: 430px) {
  .container {
    padding: 1em;
  }
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
  width: auto;
  height: auto;
  display: flex;
  flex-direction: column;
  gap: 1em;
  margin-bottom: 1em;
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
