export type AppRole = "admin" | "railway_operator" | "maintenance_team" | "emergency_response";

export interface Profile {
  id: string;
  email: string | null;
  display_name: string | null;
  avatar_url: string | null;
  roles: AppRole[];
  created_at: string;
}

export interface Drone {
  id: string;
  drone_name: string;
  status: string;
  battery_level: number;
  mission: string | null;
  current_lat: number | null;
  current_lng: number | null;
  updated_at: string;
}

export interface Incident {
  id: string;
  incident_type: string;
  severity: string;
  status: string;
  description: string | null;
  latitude: number;
  longitude: number;
  police_notified: boolean;
  firefighters_notified: boolean;
  hospitals_notified: boolean;
  created_at: string;
}

export interface Station {
  id: string;
  station_name: string;
  risk_score: number;
  latitude: number | null;
  longitude: number | null;
  updated_at: string;
}

export interface TrackDefect {
  id: string;
  defect_type: string;
  severity: string;
  status: string;
  latitude: number;
  longitude: number;
  section_name: string | null;
  drone_id: string | null;
  image_url: string | null;
  repair_cost_prediction: number | null;
  repair_time_prediction: number | null;
  detected_at: string;
}

export interface RailwayHealthScore {
  id: string;
  section_name: string;
  health_score: number;
  status: string;
  last_updated: string;
}

export interface RailwaySegment {
  id: string;
  track_id: string;
  route_name: string;
  health_score: number;
  risk_score: number;
  status: string;
  repair_time: number | null;
  last_inspection: string | null;
  path: any;
  created_at: string;
}

export interface Inspection {
  id: string;
  segment_id: string | null;
  inspection_date: string | null;
  findings: string | null;
  health_score: number;
  created_at: string;
}

export interface Alert {
  id: string;
  segment_id: string | null;
  alert_type: string;
  severity: string;
  created_at: string;
}

export interface Prediction {
  id: string;
  segment_id: string | null;
  predicted_failure: string;
  repair_time: number;
  created_at: string;
}
