import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plane, Battery, MapPin, Plus, Camera, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { RailwayMap } from "@/components/RailwayMap";
import { getERStations, Drone } from "@/lib/railway-data";
import { collection, onSnapshot, addDoc, deleteDoc, doc } from "firebase/firestore";
import { db } from "@/integrations/firebase/client";

export const Route = createFileRoute("/_authenticated/drones")({ component: Drones });

function Drones() {
  const [drones, setDrones] = useState<Drone[]>([]);
  const [stations, setStations] = useState<any[]>([]);
  const [selectedStation, setSelectedStation] = useState<string>("");
  const [isDeployOpen, setIsDeployOpen] = useState(false);
  const [activeDrone, setActiveDrone] = useState<string | null>(null);

  const [selectedStationB, setSelectedStationB] = useState<string>("");

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "drones_fleet"), (snapshot) => {
      const droneData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Drone[];
      setDrones(droneData);
    });
    getERStations().then(setStations);
    
    return () => unsub();
  }, []);

  const deployDrone = async () => {
    if (!selectedStation || !selectedStationB) {
      toast.error("Please select both start and end patrol stations.");
      return;
    }

    const stA = stations.find(s => s.properties.code === selectedStation);
    const stB = stations.find(s => s.properties.code === selectedStationB);
    if (!stA || !stA.geometry || !stB || !stB.geometry) return;

    const midLat = (stA.geometry.coordinates[1] + stB.geometry.coordinates[1]) / 2;
    const midLng = (stA.geometry.coordinates[0] + stB.geometry.coordinates[0]) / 2;

    try {
      const droneData = {
        drone_name: `Aero-Insp-0${drones.length + 1}`,
        status: "active",
        battery_level: 100,
        mission: `Patrol ${stA.properties.code} ↔ ${stB.properties.code}`,
        current_lat: midLat,
        current_lng: midLng,
        updated_at: new Date().toISOString()
      };
      await addDoc(collection(db, "drones_fleet"), droneData);
      toast.success("New drone deployed for inter-station patrol.");
      setIsDeployOpen(false);
      setSelectedStation("");
      setSelectedStationB("");
    } catch (e: any) {
      toast.error(`Failed to deploy: ${e.message}`);
    }
  };

  const captureImage = (d: Drone) => {
    toast.success(`Image captured successfully by ${d.drone_name} at [${d.current_lat?.toFixed(3)}, ${d.current_lng?.toFixed(3)}]. Transmitting to cloud...`);
  };

  const handleDeleteDrone = async (id: string, name: string) => {
    try {
      await deleteDoc(doc(db, "drones_fleet", id));
      if (activeDrone === id) setActiveDrone(null);
      toast.success(`${name} has been retired and removed from active fleet.`);
    } catch (e: any) {
      toast.error(`Failed to delete: ${e.message}`);
    }
  };

  return (
    <div className="p-6 lg:p-8 max-w-[1600px] mx-auto">
      <PageHeader eyebrow="Drone Operations" title="Aerial Fleet" description="Live status of all autonomous inspection drones across the network." />
      <div className="grid lg:grid-cols-[1fr_1.4fr] gap-4">
        <div className="space-y-3">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">Active Fleet</h3>
            <Dialog open={isDeployOpen} onOpenChange={setIsDeployOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="h-8 text-xs">
                  <Plus className="w-3 h-3 mr-1" /> Deploy Drone
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Deploy New Drone</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Start Patrol Station</label>
                    <Select value={selectedStation} onValueChange={setSelectedStation}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select station..." />
                      </SelectTrigger>
                      <SelectContent>
                        {stations.map(st => (
                          <SelectItem key={st.properties.code} value={st.properties.code}>
                            {st.properties.name} ({st.properties.code})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2 mt-4">
                    <label className="text-sm font-medium">End Patrol Station</label>
                    <Select value={selectedStationB} onValueChange={setSelectedStationB}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select station..." />
                      </SelectTrigger>
                      <SelectContent>
                        {stations.map(st => (
                          <SelectItem key={st.properties.code} value={st.properties.code}>
                            {st.properties.name} ({st.properties.code})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={deployDrone} className="w-full">Confirm Deployment</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          {drones.map((d, i) => (
            <motion.div key={d.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}>
              <Card 
                className={`glass border-border/60 p-4 cursor-pointer transition-colors ${activeDrone === d.id ? 'bg-primary/5 border-primary/50' : ''}`}
                onClick={() => setActiveDrone(d.id)}
              >
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 rounded-lg flex items-center justify-center bg-primary/15 border border-primary/30">
                    <Plane className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div className="font-bold">{d.drone_name}</div>
                      <Badge variant="outline" className={
                        d.status === "active" ? "border-[var(--success)]/50 text-[var(--success)]" :
                        d.status === "charging" ? "border-[var(--warning)]/50 text-[var(--warning)]" :
                        "border-border text-muted-foreground"
                      }>{d.status}</Badge>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">{d.mission ?? "Standby"}</div>
                    <div className="mt-3">
                      <div className="flex justify-between text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
                        <span className="flex items-center gap-1"><Battery className="w-3 h-3" />Battery</span>
                        <span className="font-mono">{d.battery_level}%</span>
                      </div>
                      <Progress value={d.battery_level} className="h-1.5" />
                    </div>
                    {d.current_lat && (
                      <div className="text-[10px] mt-2 pt-2 border-t border-border/40 text-muted-foreground flex items-center justify-between font-mono">
                        <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{d.current_lat.toFixed(3)}, {d.current_lng?.toFixed(3)}</span>
                        <div className="flex gap-2">
                          <Button size="sm" variant="secondary" className="h-6 text-xs px-2" onClick={(e) => { e.stopPropagation(); captureImage(d); }}>
                            <Camera className="w-3 h-3 mr-1" /> Image
                          </Button>
                          <Button size="sm" variant="ghost" className="h-6 w-6 p-0 hover:text-[var(--critical)]" onClick={(e) => { e.stopPropagation(); handleDeleteDrone(d.id, d.drone_name); }}>
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
        <Card className="glass border-border/60 overflow-hidden h-[600px]">
          <RailwayMap height="100%" showAll focusId={activeDrone} />
        </Card>
      </div>
    </div>
  );
}
