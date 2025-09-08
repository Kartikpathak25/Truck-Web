// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDlF4escXMQybPcmwDqXfOlD3Bbtqmn0yQ",
  authDomain: "web-truck.firebaseapp.com",
  projectId: "web-truck",
  storageBucket: "web-truck.firebasestorage.app",
  messagingSenderId: "487504344968",
  appId: "1:487504344968:web:7a7ea92dd35446f49e2c3d",
  measurementId: "G-WPXVBMYDWJ"
};


// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Services we’ll use
export const auth = getAuth(app);
export const db = getFirestore(app);
