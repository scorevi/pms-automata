import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyA5zxbYBVbPQBJLugdTyrJU27hRnizI24Q",
    authDomain: "pms-automata.firebaseapp.com",
    projectId: "pms-automata",
    storageBucket: "pms-automata.firebasestorage.app",
    messagingSenderId: "288638708542",
    appId: "1:288638708542:web:5f2edf2d3577c989bc5a6f",
    measurementId: "G-C9TZFCQ7ZL"
  };

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };
