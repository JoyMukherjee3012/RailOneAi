import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, setDoc, doc } from "firebase/firestore";

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

const stationsData = [
  { id: "HWH", stationCode: "HWH", stationName: "Howrah Junction", latitude: 22.5833, longitude: 88.3333, zone: "Eastern Railway", division: "Howrah" },
  { id: "ASN", stationCode: "ASN", stationName: "Asansol Junction", latitude: 23.6833, longitude: 86.9833, zone: "Eastern Railway", division: "Asansol" },
  { id: "DHN", stationCode: "DHN", stationName: "Dhanbad Junction", latitude: 23.7917, longitude: 86.4333, zone: "East Central", division: "Dhanbad" },
  { id: "GAYA", stationCode: "GAYA", stationName: "Gaya Junction", latitude: 24.7964, longitude: 84.9914, zone: "East Central", division: "Mughalsarai" },
  { id: "MGS", stationCode: "MGS", stationName: "Pt. DD Upadhyaya", latitude: 25.2818, longitude: 83.1207, zone: "East Central", division: "Mughalsarai" },
  { id: "PRYJ", stationCode: "PRYJ", stationName: "Prayagraj Junction", latitude: 25.4484, longitude: 81.8333, zone: "North Central", division: "Prayagraj" },
  { id: "CNB", stationCode: "CNB", stationName: "Kanpur Central", latitude: 26.4539, longitude: 80.3458, zone: "North Central", division: "Prayagraj" },
  { id: "NDLS", stationCode: "NDLS", stationName: "New Delhi", latitude: 28.6428, longitude: 77.2191, zone: "Northern Railway", division: "Delhi" },
  { id: "CSMT", stationCode: "CSMT", stationName: "Chhatrapati Shivaji Maharaj Terminus", latitude: 18.9398, longitude: 72.8354, zone: "Central Railway", division: "Mumbai" },
  { id: "KYN", stationCode: "KYN", stationName: "Kalyan Junction", latitude: 19.2355, longitude: 73.1299, zone: "Central Railway", division: "Mumbai" },
  { id: "NK", stationCode: "NK", stationName: "Nashik Road", latitude: 19.9691, longitude: 73.8188, zone: "Central Railway", division: "Bhusawal" },
  { id: "BSL", stationCode: "BSL", stationName: "Bhusawal Junction", latitude: 21.0450, longitude: 75.7678, zone: "Central Railway", division: "Bhusawal" },
  { id: "ET", stationCode: "ET", stationName: "Itarsi Junction", latitude: 22.6105, longitude: 77.7663, zone: "West Central", division: "Bhopal" },
  { id: "BPL", stationCode: "BPL", stationName: "Bhopal Junction", latitude: 23.2599, longitude: 77.4126, zone: "West Central", division: "Bhopal" },
  { id: "JHS", stationCode: "JHS", stationName: "VGL Jhansi", latitude: 25.4384, longitude: 78.5802, zone: "North Central", division: "Jhansi" },
];

const trainsData = [
  { id: "12301", trainNumber: "12301", trainName: "Howrah Rajdhani Express", sourceStation: "HWH", destinationStation: "NDLS", routeId: "HWH_NDLS" },
  { id: "12259", trainNumber: "12259", trainName: "Sealdah Duronto Express", sourceStation: "HWH", destinationStation: "NDLS", routeId: "HWH_NDLS" },
  { id: "12004", trainNumber: "12004", trainName: "New Delhi Bhopal Shatabdi", sourceStation: "NDLS", destinationStation: "BPL", routeId: "NDLS_BPL" },
  { id: "12137", trainNumber: "12137", trainName: "Punjab Mail", sourceStation: "CSMT", destinationStation: "NDLS", routeId: "CSMT_NDLS" },
];

const routesData = [
  {
    id: "HWH_NDLS",
    routeId: "HWH_NDLS",
    routeName: "Howrah - New Delhi Grand Chord",
    trainNumber: "12301",
    stations: ["HWH", "ASN", "DHN", "GAYA", "MGS", "PRYJ", "CNB", "NDLS"],
    coordinates: [
      { lat: 22.5833, lng: 88.3333 }, // HWH
      { lat: 23.6833, lng: 86.9833 }, // ASN
      { lat: 23.7917, lng: 86.4333 }, // DHN
      { lat: 24.7964, lng: 84.9914 }, // GAYA
      { lat: 25.2818, lng: 83.1207 }, // MGS
      { lat: 25.4484, lng: 81.8333 }, // PRYJ
      { lat: 26.4539, lng: 80.3458 }, // CNB
      { lat: 28.6428, lng: 77.2191 }  // NDLS
    ]
  },
  {
    id: "CSMT_NDLS",
    routeId: "CSMT_NDLS",
    routeName: "Mumbai - New Delhi Central Line",
    trainNumber: "12137",
    stations: ["CSMT", "KYN", "NK", "BSL", "ET", "BPL", "JHS", "NDLS"],
    coordinates: [
      { lat: 18.9398, lng: 72.8354 }, // CSMT
      { lat: 19.2355, lng: 73.1299 }, // KYN
      { lat: 19.9691, lng: 73.8188 }, // NK
      { lat: 21.0450, lng: 75.7678 }, // BSL
      { lat: 22.6105, lng: 77.7663 }, // ET
      { lat: 23.2599, lng: 77.4126 }, // BPL
      { lat: 25.4384, lng: 78.5802 }, // JHS
      { lat: 28.6428, lng: 77.2191 }  // NDLS
    ]
  }
];

const trackHealthData = [
  {
    id: "HWH_NDLS",
    routeId: "HWH_NDLS",
    healthScore: 72,
    riskScore: 31,
    repairTime: 5,
    maintenancePriority: "Medium",
    status: "Warning",
    lastInspection: new Date().toISOString()
  },
  {
    id: "CSMT_NDLS",
    routeId: "CSMT_NDLS",
    healthScore: 35,
    riskScore: 85,
    repairTime: 14,
    maintenancePriority: "Critical",
    status: "Red",
    lastInspection: new Date().toISOString()
  }
];

const alertsData = [
  {
    routeId: "CSMT_NDLS",
    alertType: "Track Geometry Shift",
    severity: "Red",
    description: "Severe alignment shift detected near Itarsi Junction.",
    timestamp: new Date().toISOString()
  },
  {
    routeId: "HWH_NDLS",
    alertType: "Ballast Degradation",
    severity: "Warning",
    description: "Ballast profile thinning observed near Dhanbad.",
    timestamp: new Date().toISOString()
  }
];

const seedData = async () => {
  console.log("Seeding Indian Railways data...");
  for (const s of stationsData) {
    await setDoc(doc(db, "stations_ir", s.id), s);
  }
  for (const t of trainsData) {
    await setDoc(doc(db, "trains_ir", t.id), t);
  }
  for (const r of routesData) {
    await setDoc(doc(db, "routes_ir", r.id), r);
  }
  for (const th of trackHealthData) {
    await setDoc(doc(db, "track_health", th.id), th);
  }
  for (const a of alertsData) {
    await addDoc(collection(db, "alerts_ir"), a);
  }
  console.log("Indian Railways Seeding Complete!");
  process.exit(0);
};

seedData().catch(console.error);
