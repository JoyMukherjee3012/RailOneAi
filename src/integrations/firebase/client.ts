import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyCOphPSIUCtBCe9-s1yAVJROgptP9qvNLU",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "railoneai-c3d09.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "railoneai-c3d09",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "railoneai-c3d09.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "401717743827",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:401717743827:web:6864806423367e18c38426",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-BRJSPZXX0Y",
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
