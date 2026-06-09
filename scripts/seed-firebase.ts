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
  console.log("Seeding Firestore...");

  // Railway Segments
  const segmentsRef = collection(db, "railway_segments");
  const segId1 = "seg-1";
  await setDoc(doc(db, "railway_segments", segId1), {
    track_id: "TRK-NDLS-01",
    route_name: "New Delhi - Ghaziabad Sec 1",
    health_score: 92,
    risk_score: 12,
    status: "healthy",
    path: [
      { lat: 28.643, lng: 77.220 },
      { lat: 28.650, lng: 77.300 },
      { lat: 28.665, lng: 77.420 }
    ],
    created_at: new Date().toISOString()
  });

  const segId2 = "seg-2";
  await setDoc(doc(db, "railway_segments", segId2), {
    track_id: "TRK-MUMB-02",
    route_name: "Mumbai Central - Borivali",
    health_score: 45,
    risk_score: 85,
    status: "critical",
    path: [
      { lat: 18.969, lng: 72.820 },
      { lat: 19.050, lng: 72.840 },
      { lat: 19.230, lng: 72.855 }
    ],
    created_at: new Date().toISOString()
  });

  // Track Defects
  await addDoc(collection(db, "track_defects"), {
    defect_type: "Rail Fracture",
    severity: "critical",
    status: "open",
    latitude: 19.050,
    longitude: 72.840,
    section_name: "Mumbai Central - Borivali",
    repair_cost_prediction: 450000,
    repair_time_prediction: 180,
    detected_at: new Date().toISOString()
  });

  await addDoc(collection(db, "track_defects"), {
    defect_type: "Missing Fasteners",
    severity: "medium",
    status: "open",
    latitude: 28.650,
    longitude: 77.300,
    section_name: "New Delhi - Ghaziabad Sec 1",
    repair_cost_prediction: 12000,
    repair_time_prediction: 45,
    detected_at: new Date().toISOString()
  });

  // Drones
  await addDoc(collection(db, "drones"), {
    drone_name: "Aero-Insp-01",
    status: "active",
    battery_level: 78,
    mission: "Patrol Mumbai Central",
    current_lat: 19.055,
    current_lng: 72.845,
    updated_at: new Date().toISOString()
  });

  // Alerts
  await addDoc(collection(db, "alerts"), {
    segment_id: segId2,
    alert_type: "Critical Rail Fracture",
    severity: "emergency",
    created_at: new Date().toISOString()
  });

  // Incidents
  await addDoc(collection(db, "incidents"), {
    incident_type: "Track Failure",
    severity: "critical",
    status: "active",
    description: "Major fracture reported near Borivali.",
    latitude: 19.050,
    longitude: 72.840,
    police_notified: true,
    firefighters_notified: false,
    hospitals_notified: true,
    created_at: new Date().toISOString()
  });

  // Stations
  await addDoc(collection(db, "stations"), {
    station_name: "New Delhi Station",
    crowd_density: 88,
    risk_score: 45,
    latitude: 28.643,
    longitude: 77.220,
    updated_at: new Date().toISOString()
  });

  await addDoc(collection(db, "stations"), {
    station_name: "Mumbai Central",
    crowd_density: 95,
    risk_score: 60,
    latitude: 18.969,
    longitude: 72.820,
    updated_at: new Date().toISOString()
  });

  // Health Scores
  await addDoc(collection(db, "railway_health_scores"), {
    section_name: "Northern Grid",
    health_score: 82,
    status: "healthy",
    last_updated: new Date().toISOString()
  });
  
  await addDoc(collection(db, "railway_health_scores"), {
    section_name: "Western Suburbs",
    health_score: 55,
    status: "warning",
    last_updated: new Date().toISOString()
  });

  console.log("Seeding complete!");
  process.exit(0);
};

seedData().catch(console.error);
