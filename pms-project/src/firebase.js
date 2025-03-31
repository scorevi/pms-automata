import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// ✅ Replace these with your actual Firebase config from Firebase Console
const firebaseConfig = {
  apiKey: "AIzaSyA7ns1QDm1wyqc1PO6taLhUf_f2IkLHLlc",
  authDomain: "pms-automata-dev.firebaseapp.com",
  projectId: "pms-automata-dev",
  storageBucket: "pms-automata-dev.firebasestorage.app",
  messagingSenderId: "520022139248",
  appId: "1:520022139248:web:4db981818ce6a4d60aefb5",
  measurementId: "G-SHQDGM8SBJ"
};

// ✅ Initialize Firebase App
const app = initializeApp(firebaseConfig);

// ✅ Initialize Services
const auth = getAuth(app);
const db = getFirestore(app);

// ✅ Export the initialized instances
export { auth, db };
