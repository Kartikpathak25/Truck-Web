// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCJ11UL9ECeAMgZNt9h2-dl8JpRg_Qru44",
  authDomain: "web-truck-d4359.firebaseapp.com",
  projectId: "web-truck-d4359",
  storageBucket: "web-truck-d4359.appspot.com",   // ✅ fixed
  messagingSenderId: "71775287683",
  appId: "1:71775287683:web:a19685973a3c226f471eb6",
  measurementId: "G-95PBCVTEC6"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Services we’ll use
export const auth = getAuth(app);
export const db = getFirestore(app);
