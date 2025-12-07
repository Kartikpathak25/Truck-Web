// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBiyLpsC5ajcQGopAu-naA99ExF6tUsUr0",
  authDomain: "truck-web-4eab7.firebaseapp.com",
  projectId: "truck-web-4eab7",
  storageBucket: "truck-web-4eab7.appspot.com",   // ✅ correct domain
  messagingSenderId: "845848195246",
  appId: "1:845848195246:web:65032b90400e76d7eafd3f",
  measurementId: "G-1H9VXKMTLW"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Services we’ll use
export const auth = getAuth(app);
export const db = getFirestore(app);
