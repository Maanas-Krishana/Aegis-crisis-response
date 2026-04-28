import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyC_69YhhXbm77xdD-GY6IDuoQ_FtWWot5U",
  authDomain: "aegis-f1b5d.firebaseapp.com",
  projectId: "aegis-f1b5d",
  storageBucket: "aegis-f1b5d.firebasestorage.app",
  messagingSenderId: "349523592319",
  appId: "1:349523592319:web:4e0d035a0d5afc94a8eb4a",
  measurementId: "G-4DCPKNJCB4"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
export const db = getFirestore(app);
