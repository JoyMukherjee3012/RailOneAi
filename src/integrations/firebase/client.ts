import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCOphPSIUCtBCe9-s1yAVJROgptP9qvNLU",
  authDomain: "railoneai-c3d09.firebaseapp.com",
  projectId: "railoneai-c3d09",
  storageBucket: "railoneai-c3d09.firebasestorage.app",
  messagingSenderId: "401717743827",
  appId: "1:401717743827:web:6864806423367e18c38426",
  measurementId: "G-BRJSPZXX0Y"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
