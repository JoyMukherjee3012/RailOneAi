import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { getERTrains, getTrackDefects, getIncidents, getDrones } from "@/lib/railway-data";
import { PageHeader } from "@/components/PageHeader";
import { RailwayMap } from "@/components/RailwayMap";
import { DigitalTwinPanel } from "@/components/DigitalTwinPanel";
import { GlobalSearch } from "@/components/GlobalSearch";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { TrainFront, Plane, MapPin, AlertOctagon, Cloud, Users } from "lucide-react";

export const Route = createFileRoute("/_authenticated/digital-twin")({ component: DigitalTwin });

function DigitalTwin() {
  const [layers, setLayers] = useState({ trains: true, drones: true, stations: true, defects: true, emergencies: true, weather: false });
  const [counts, setCounts] = useState({ trains: 0, drones: 0, stations: 0, defects: 0, emergencies: 0, weather: 0 });
  const [activeSegmentId, setActiveSegmentId] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchData = () => {
      Promise.all([
        getERTrains(),
        getDrones(),
        getTrackDefects(),
        getIncidents()
      ]).then(([t, d, td, i]) => {
        if (!isMounted) return;
        setCounts(prev => ({ 
          ...prev,
          trains: t.length, 
          drones: d.length, 
          defects: td.length, 
          emergencies: i.length, 
          weather: 1 
        }));
      });
    };
    
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="p-6 lg:p-8 max-w-[1800px] mx-auto relative">
      <PageHeader eyebrow="Digital Twin" title="Live Network Map"
        description="Interactive view of the entire railway grid — trains, drones, defects, incidents and stations." 
        actions={<GlobalSearch onSelect={setActiveSegmentId} />} />
      
      <DigitalTwinPanel segmentId={activeSegmentId} onClose={() => setActiveSegmentId(null)} />

      <div className="grid lg:grid-cols-[1fr_300px] gap-4 h-[calc(100vh-220px)]">
        <Card className="glass border-border/60 overflow-hidden">
          <RailwayMap 
            height="100%" 
            layers={layers as any} 
            onSegmentClick={setActiveSegmentId} 
            focusId={activeSegmentId} 
            onStationsLoaded={(c) => setCounts(prev => ({ ...prev, stations: c }))} 
          />
        </Card>
        <div className="space-y-4 overflow-y-auto">
          <Card className="glass border-border/60 p-4">
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-3">Map Layers</div>
            <div className="space-y-2.5">
              {[
                { key: "trains", label: "Trains", icon: TrainFront, count: counts.trains },
                { key: "drones", label: "Drones", icon: Plane, count: counts.drones },
                { key: "stations", label: "Stations", icon: MapPin, count: counts.stations },
                { key: "defects", label: "Track defects", icon: AlertOctagon, count: counts.defects },
                { key: "emergencies", label: "Emergencies", icon: AlertOctagon, count: counts.emergencies },
                { key: "weather", label: "Weather overlay", icon: Cloud, count: counts.weather },
              ].map((l) => (
                <div key={l.key} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2"><l.icon className="w-4 h-4 text-muted-foreground" />{l.label}</div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[10px]">{l.count}</Badge>
                    <Switch checked={(layers as any)[l.key]} onCheckedChange={(v) => setLayers((s) => ({ ...s, [l.key]: v }))} />
                  </div>
                </div>
              ))}
            </div>
          </Card>
          <Card className="glass border-border/60 p-4">
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-3">Legend</div>
            <div className="space-y-2 text-xs">
              <LegendItem color="#22c55e" label="Safe" />
              <LegendItem color="#eab308" label="Warning" />
              <LegendItem color="#f97316" label="High severity" />
              <LegendItem color="#ef4444" label="Critical / Emergency" />
              <LegendItem color="#ffffff" label="Train" shape="square" />
              <LegendItem color="#60a5fa" label="Drone" />
              <LegendItem color="#D72638" label="Station" shape="square" />
              <LegendItem color="#eab308" label="Weather Warning (Radius)" />
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function LegendItem({ color, label, shape = "dot" }: { color: string; label: string; shape?: "dot" | "square" }) {
  return (
    <div className="flex items-center gap-2">
      <div className={`w-3 h-3 ${shape === "square" ? "rounded-sm" : "rounded-full"} border border-white/40`} style={{ background: color }} />
      {label}
    </div>
  );
}