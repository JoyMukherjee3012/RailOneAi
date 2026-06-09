import { useEffect, useState, useMemo } from "react";
import Map, { Marker, NavigationControl, Popup, Source, Layer } from "react-map-gl/maplibre";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { Button } from "@/components/ui/button";
import { RefreshCcw, AlertTriangle, Cloud, Mountain } from "lucide-react";
import { getERTrains, getTrackDefects, getIncidents, getDrones, getStationHealth, getERStations } from "@/lib/railway-data";
import { useWeather } from "@/hooks/useWeather";
import { useElevation } from "@/hooks/useElevation";

function StationPopup({ station, onClose }: { station: any, onClose: () => void }) {
  const lat = station.geometry.coordinates[1];
  const lon = station.geometry.coordinates[0];
  const { weather, loading: wLoading } = useWeather(lat, lon);
  const { elevation, loading: eLoading } = useElevation(lat, lon);

  return (
    <Popup
      longitude={lon}
      latitude={lat}
      anchor="bottom"
      onClose={onClose}
      closeOnClick={false}
      className="text-black"
    >
      <div className="p-2 min-w-[220px]">
        <h3 className="font-bold text-lg">{station.properties.name}</h3>
        <p className="text-sm text-gray-600">Code: {station.properties.code}</p>
        <p className="text-sm text-gray-600">Division: {station.properties.zone}</p>
        <p className="text-sm text-gray-600">Category: {station.properties.category}</p>
        
        <div className="mt-2 space-y-1 border-t pt-2">
          <div className="flex items-center gap-2 text-sm">
            <Cloud className="w-4 h-4 text-blue-500" />
            {wLoading ? <span>Loading weather...</span> : weather ? (
              <span>{weather.current?.temperature_2m}°C, {weather.current?.precipitation}mm rain</span>
            ) : <span>Weather unavailable</span>}
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Mountain className="w-4 h-4 text-amber-600" />
            {eLoading ? <span>Loading elevation...</span> : elevation !== null ? (
              <span>{elevation} meters</span>
            ) : <span>Elevation unavailable</span>}
          </div>
        </div>

        {station.properties.remarks && (
          <p className="text-xs text-red-500 mt-2">{station.properties.remarks}</p>
        )}
      </div>
    </Popup>
  );
}

interface Props { 
  height?: string; 
  showAll?: boolean;
  layers?: { trains?: boolean; drones?: boolean; stations?: boolean; defects?: boolean; emergencies?: boolean; weather?: boolean };
  onSegmentClick?: (id: string) => void;
  focusId?: string | null;
  onStationsLoaded?: (count: number) => void;
}

export function RailwayMap({ height = "100%", showAll = true, layers, onSegmentClick, focusId, onStationsLoaded }: Props) {
  const [viewState, setViewState] = useState({
    longitude: 87.5,
    latitude: 23.5,
    zoom: 6,
    pitch: 0,
    bearing: 0
  });

  const [stations, setStations] = useState<any[]>([]);
  const [trains, setTrains] = useState<any[]>([]);
  const [defects, setDefects] = useState<any[]>([]);
  const [incidents, setIncidents] = useState<any[]>([]);
  const [drones, setDrones] = useState<any[]>([]);
  const [selectedStation, setSelectedStation] = useState<any | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      const [st, tr, df, inc, dr] = await Promise.all([
        getERStations(),
        getERTrains(),
        getTrackDefects(),
        getIncidents(),
        getDrones()
      ]);
      if (!isMounted) return;
      setStations(st);
      if (onStationsLoaded) onStationsLoaded(st.length);
      setTrains(tr);
      setDefects(df);
      setIncidents(inc);
      setDrones(dr);
    }
    loadData();
    const interval = setInterval(() => {
      loadData();
    }, 5000); // Live real-time monitoring update every 5s
    
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [onStationsLoaded]);

  // Handle focus
  useEffect(() => {
    if (focusId) {
      let targetCoords: [number, number] | null = null;
      
      const st = stations.find(s => s.properties.code === focusId);
      if (st && st.geometry) targetCoords = [st.geometry.coordinates[0], st.geometry.coordinates[1]];
      
      if (!targetCoords) {
        const inc = incidents.find(i => i.id === focusId);
        if (inc) targetCoords = [inc.longitude, inc.latitude];
      }
      
      if (!targetCoords) {
        const dr = drones.find(d => d.id === focusId);
        if (dr && dr.current_lng && dr.current_lat) targetCoords = [dr.current_lng, dr.current_lat];
      }
      
      if (!targetCoords) {
        const df = defects.find(d => d.id === focusId);
        if (df && df.longitude && df.latitude) targetCoords = [df.longitude, df.latitude];
      }
      
      if (targetCoords) {
        setViewState({
          ...viewState,
          longitude: targetCoords[0],
          latitude: targetCoords[1],
          zoom: 13
        });
      }
    }
  }, [focusId, stations, incidents, drones, defects]);

  const showStations = layers ? layers.stations !== false : showAll;
  const showTrains = layers ? layers.trains !== false : showAll;
  const showDefects = layers ? layers.defects !== false : showAll;
  const showEmergencies = layers ? layers.emergencies !== false : showAll;
  const showDrones = layers ? layers.drones !== false : showAll;

  const handleReset = () => {
    setViewState({
      longitude: 87.5,
      latitude: 23.5,
      zoom: 6,
      pitch: 0,
      bearing: 0
    });
  };

  const handleFocusCritical = () => {
    // Basic implementation to focus on a random critical incident if any
    if (incidents.length > 0) {
      setViewState({
        ...viewState,
        longitude: incidents[0].longitude,
        latitude: incidents[0].latitude,
        zoom: 10
      });
    }
  };

  const openFreeMapStyle = "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json";

  // Create a GeoJSON FeatureCollection for the train routes
  const trainRoutesGeoJSON = useMemo(() => {
    return {
      type: 'FeatureCollection',
      features: trains.filter(t => t.geometry && t.geometry.coordinates && t.geometry.coordinates.length > 0)
    };
  }, [trains]);

  return (
    <div className="relative w-full rounded-xl overflow-hidden border border-border/60 group" style={{ height, minHeight: '400px' }}>
      <Map
        {...viewState}
        onMove={evt => setViewState(evt.viewState)}
        mapStyle={openFreeMapStyle}
        style={{ width: '100%', height: '100%' }}
      >
        <NavigationControl position="bottom-right" />

        {/* Render Train Routes using GeoJSON Source */}
        {showTrains && (
          <Source id="train-routes" type="geojson" data={trainRoutesGeoJSON as any}>
            <Layer 
              id="train-lines" 
              type="line" 
              paint={{
                'line-color': '#22c55e',
                'line-width': 3,
                'line-opacity': 0.8
              }} 
            />
          </Source>
        )}

        {/* Render Train Markers (approximate location) */}
        {showTrains && trains.map((t, idx) => {
          const coords = t.geometry?.coordinates;
          if (!coords || coords.length === 0) return null;
          // Just place marker at 30% of the route for demo
          const coord = coords[Math.floor(coords.length * 0.3)];
          return (
            <Marker 
              key={`train-${idx}`} 
              longitude={coord[0]} 
              latitude={coord[1]}
              onClick={e => {
                e.originalEvent.stopPropagation();
                if (onSegmentClick) onSegmentClick(t.properties.number);
              }}
            >
              <div className="w-3 h-3 rounded-sm bg-white border border-black cursor-pointer hover:scale-125 transition-transform" />
            </Marker>
          );
        })}

        {/* Render Stations */}
        {showStations && stations.map((station, idx) => {
          if (!station.geometry) return null;
          return (
            <Marker 
              key={`station-${idx}`} 
              longitude={station.geometry.coordinates[0]} 
              latitude={station.geometry.coordinates[1]}
              onClick={e => {
                e.originalEvent.stopPropagation();
                setSelectedStation(station);
                if (onSegmentClick) onSegmentClick(station.properties.code);
              }}
            >
              <div className="w-2 h-2 rounded-sm bg-[#D72638] border border-white cursor-pointer hover:scale-150 transition-transform" />
            </Marker>
          );
        })}

        {/* Render Defects */}
        {showDefects && defects.map((defect, idx) => (
          <Marker 
            key={`defect-${idx}`} 
            longitude={defect.longitude} 
            latitude={defect.latitude}
          >
            <div className="w-3 h-3 rounded-full border border-white cursor-pointer" style={{ backgroundColor: defect.severity === 'critical' ? '#ef4444' : '#eab308' }} />
          </Marker>
        ))}

        {/* Render Emergencies */}
        {showEmergencies && incidents.map((inc, idx) => (
          <Marker 
            key={`inc-${idx}`} 
            longitude={inc.longitude} 
            latitude={inc.latitude}
          >
            <div className="w-4 h-4 rounded-full border-2 border-white cursor-pointer animate-ping" style={{ backgroundColor: '#ef4444' }} />
          </Marker>
        ))}

        {/* Render Drones */}
        {showDrones && drones.map((drone, idx) => {
          if (!drone.current_lng || !drone.current_lat) return null;
          return (
            <Marker 
              key={`drone-${idx}`} 
              longitude={drone.current_lng} 
              latitude={drone.current_lat}
            >
              <div className="w-2 h-2 rounded-full border border-[#1e3a8a] cursor-pointer bg-[#60a5fa]" />
            </Marker>
          );
        })}

        {/* Station Popup containing weather & elevation hooks */}
        {selectedStation && selectedStation.geometry && (
          <StationPopup 
            station={selectedStation} 
            onClose={() => setSelectedStation(null)} 
          />
        )}
      </Map>
      
      {/* Map Controls */}
      <div className="absolute bottom-6 right-16 flex flex-col gap-2 z-10">
        <Button variant="secondary" size="icon" className="w-10 h-10 shadow-lg backdrop-blur-md bg-background/80" onClick={handleFocusCritical} title="Focus Critical Areas">
          <AlertTriangle className="w-4 h-4 text-[var(--critical)]" />
        </Button>
        <Button variant="secondary" size="icon" className="w-10 h-10 shadow-lg backdrop-blur-md bg-background/80" onClick={handleReset} title="Reset View">
          <RefreshCcw className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}