import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, doc, setDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCOphPSIUCtBCe9-s1yAVJROgptP9qvNLU",
  authDomain: "railoneai-c3d09.firebaseapp.com",
  projectId: "railoneai-c3d09",
  storageBucket: "railoneai-c3d09.firebasestorage.app",
  messagingSenderId: "401717743827",
  appId: "1:401717743827:web:6864806423367e18c38426",
  measurementId: "G-BRJSPZXX0Y"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const seedData = async () => {
  console.log("Seeding trains and weather...");

  // Trains
  await addDoc(collection(db, "trains"), {
    train_number: "12953",
    train_name: "August Kranti Rajdhani",
    status: "on-time",
    speed_kmh: 125,
    latitude: 28.643,
    longitude: 77.220,
    heading: 180,
    last_updated: new Date().toISOString()
  });

  await addDoc(collection(db, "trains"), {
    train_number: "12903",
    train_name: "Golden Temple Mail",
    status: "delayed",
    speed_kmh: 45,
    latitude: 19.055,
    longitude: 72.845,
    heading: 90,
    last_updated: new Date().toISOString()
  });

  await addDoc(collection(db, "trains"), {
    train_number: "12004",
    train_name: "Shatabdi Express",
    status: "on-time",
    speed_kmh: 110,
    latitude: 21.145,
    longitude: 79.088, // Nagpur area
    heading: 270,
    last_updated: new Date().toISOString()
  });

  // Weather Events
  await addDoc(collection(db, "weather_events"), {
    event_type: "Heavy Rain",
    severity: "warning",
    latitude: 19.055,
    longitude: 72.845,
    radius_km: 15,
    description: "Intense pre-monsoon showers affecting Western Suburbs.",
    timestamp: new Date().toISOString()
  });

  await addDoc(collection(db, "weather_events"), {
    event_type: "Dense Fog",
    severity: "critical",
    latitude: 28.643,
    longitude: 77.220,
    radius_km: 25,
    description: "Visibility drops below 50m near New Delhi. Reduced speed enforced.",
    timestamp: new Date().toISOString()
  });

  console.log("Seeding complete!");
  process.exit(0);
};

seedData().catch(console.error);
