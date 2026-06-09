import * as Papa from 'papaparse';
import { collection, getDocs, addDoc, deleteDoc, doc } from "firebase/firestore";
import { db } from "@/integrations/firebase/client";

export interface StationProperties {
  state: string | null;
  code: string;
  name: string;
  zone: string | null;
  address: string | null;
  category?: string;
  remarks?: string;
}

export interface StationFeature {
  type: string;
  geometry: {
    type: string;
    coordinates: [number, number]; // lon, lat
  } | null;
  properties: StationProperties;
}

export interface RailwayData {
  stations: StationFeature[];
}

export interface TrainProperties {
  zone: string;
  name: string;
  number: string;
  from_station_name: string;
  to_station_name: string;
  type: string;
  departure?: string;
  arrival?: string;
}

export interface TrainFeature {
  type: string;
  geometry: {
    type: string;
    coordinates: [number, number][];
  } | null;
  properties: TrainProperties;
}

// Fetch stations from the generated CSV (Eastern Railway single source of truth)
export async function getERStations(): Promise<StationFeature[]> {
  try {
    const response = await fetch('/data/stations.csv');
    if (!response.ok) throw new Error('Failed to fetch stations.csv');
    const csvText = await response.text();
    
    return new Promise((resolve) => {
      Papa.parse(csvText, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        complete: (results) => {
          if (!results || !results.data) {
            resolve([]);
            return;
          }
          const stations: StationFeature[] = results.data.map((row: any) => {
            const lon = parseFloat(row.longitude);
            const lat = parseFloat(row.latitude);
            const isValid = !isNaN(lon) && !isNaN(lat);
            
            return {
              type: "Feature",
              geometry: isValid ? {
                type: "Point",
                coordinates: [lon, lat]
              } : null,
              properties: {
                code: row.station_code,
                name: row.station_name,
                zone: row.division,
                category: row.category,
                remarks: row.remarks,
                state: null,
                address: null
              }
            };
          });
          resolve(stations);
        }
      });
    });
  } catch (error) {
    console.error('Error loading ER stations:', error);
    return [];
  }
}

// Health Score generation based on station code
export function getStationHealth(code: string): { score: number, status: 'Healthy' | 'Needs Monitoring' | 'Maintenance Required' | 'Critical' } {
  // Deterministic random score based on station code
  const hash = code.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  // Give most stations a good score, but some lower
  const baseScore = 60 + (hash % 40);
  
  // Apply a few artificial critical/maintenance scenarios for demo
  let finalScore = baseScore;
  if (hash % 10 === 0) finalScore -= 30; // some critical
  if (hash % 7 === 0) finalScore -= 15;  // some maintenance
  
  finalScore = Math.max(0, Math.min(100, finalScore));
  
  let status: 'Healthy' | 'Needs Monitoring' | 'Maintenance Required' | 'Critical' = 'Healthy';
  if (finalScore >= 80) status = 'Healthy';
  else if (finalScore >= 60) status = 'Needs Monitoring';
  else if (finalScore >= 40) status = 'Maintenance Required';
  else status = 'Critical';
  
  return { score: finalScore, status };
}

export async function getERTrains(): Promise<TrainFeature[]> {
  try {
    const response = await fetch('/data/trains.json');
    if (!response.ok) throw new Error('Failed to fetch trains data');
    const data = await response.json();
    
    if (!data || !data.features) return [];
    
    // Filter for ER zone
    const erTrains = data.features.filter((f: TrainFeature) => 
      f.properties?.zone === 'ER' && 
      f.geometry && 
      f.geometry.coordinates && 
      f.geometry.coordinates.length > 0
    );
    
    return erTrains;
  } catch (error) {
    console.error('Error loading ER trains:', error);
    return [];
  }
}

export async function getTrackDefects() {
  const allStations = await getERStations();
  const erStations = allStations.filter(s => s.geometry !== null && s.geometry.coordinates);
  
  // Generate simulated defects for some stations
  const defects = [];
  if (erStations.length > 0) {
    for (let i = 0; i < Math.min(15, erStations.length); i++) {
      const station = erStations[(i * 7) % erStations.length]; // pick pseudo-random stations
      const isCritical = i % 4 === 0;
      
      defects.push({
        id: `DEF-${1000 + i}`,
        defect_type: isCritical ? 'Rail Crack' : (i % 2 === 0 ? 'Missing Fasteners' : 'Track Misalignment'),
        severity: isCritical ? 'critical' : (i % 2 === 0 ? 'medium' : 'high'),
        section_name: `Near ${station.properties.name} (${station.properties.code})`,
        latitude: station.geometry!.coordinates[1],
        longitude: station.geometry!.coordinates[0],
        repair_time_prediction: isCritical ? 240 : (i % 2 === 0 ? 45 : 120),
        repair_cost_prediction: isCritical ? 550000 : (i % 2 === 0 ? 15000 : 85000),
        status: isCritical ? 'Unverified' : 'Engineer Assigned',
        detected_at: new Date(Date.now() - i * 3600000).toISOString(),
      });
    }
  }
  return defects;
}

export async function getIncidents() {
  try {
    const querySnapshot = await getDocs(collection(db, "incidents"));
    
    if (querySnapshot.empty) {
      console.log("No incidents found in Firestore, seeding defaults...");
      const allStations = await getERStations();
      const erStations = allStations.filter(s => s.geometry !== null && s.geometry.coordinates);
      
      const incidents = [];
      if (erStations.length > 1) {
        for (let i = 0; i < Math.min(6, erStations.length - 1); i++) {
          const isBetween = i % 2 !== 0;
          const stationA = erStations[(i * 3) % erStations.length];
          
          let lat = stationA.geometry!.coordinates[1];
          let lng = stationA.geometry!.coordinates[0];
          let desc = `Reported incident at ${stationA.properties.name} (${stationA.properties.code}).`;
          
          if (isBetween) {
            const stationB = erStations[(i * 3 + 1) % erStations.length];
            lat = (stationA.geometry!.coordinates[1] + stationB.geometry!.coordinates[1]) / 2;
            lng = (stationA.geometry!.coordinates[0] + stationB.geometry!.coordinates[0]) / 2;
            desc = `Incident reported between ${stationA.properties.name} and ${stationB.properties.name}.`;
          }

          const newIncident = {
            incident_type: i === 0 ? 'Major Fire' : (i === 1 ? 'Derailment Risk' : 'Signal Failure'),
            severity: i === 0 ? 'critical' : (i === 1 || i === 3 ? 'high' : 'medium'),
            status: 'Active',
            description: desc,
            latitude: lat,
            longitude: lng,
            police_notified: false,
            firefighters_notified: false,
            hospitals_notified: false,
            engineers_notified: false,
            created_at: new Date(Date.now() - i * 1800000).toISOString(),
          };

          const docRef = await addDoc(collection(db, "incidents"), newIncident);
          incidents.push({ id: docRef.id, ...newIncident });
        }
      }
      return incidents;
    }

    const incidents: any[] = [];
    querySnapshot.forEach((doc) => {
      incidents.push({ id: doc.id, ...doc.data() });
    });
    return incidents;
  } catch (e) {
    console.error('Failed to read incidents from Firestore', e);
    return [];
  }
}

// Local Storage for Drones
export interface Drone {
  id: string;
  drone_name: string;
  battery_level: number;
  status: string;
  mission: string | null;
  current_lat: number | null;
  current_lng: number | null;
  updated_at?: string;
}

export async function getDrones(): Promise<Drone[]> {
  try {
    const querySnapshot = await getDocs(collection(db, "drones_fleet"));
    const drones: Drone[] = [];
    querySnapshot.forEach((doc) => {
      drones.push({ id: doc.id, ...doc.data() } as Drone);
    });
    return drones;
  } catch (e) {
    console.error('Failed to read drones from Firestore', e);
    return [];
  }
}

export async function saveDrone(drone: Omit<Drone, 'id'>): Promise<Drone> {
  const docRef = await addDoc(collection(db, "drones_fleet"), drone);
  return {
    ...drone,
    id: docRef.id
  };
}

export async function deleteDrone(id: string): Promise<void> {
  await deleteDoc(doc(db, "drones_fleet", id));
}
