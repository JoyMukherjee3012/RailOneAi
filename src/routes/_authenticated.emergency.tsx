import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { getIncidents } from "@/lib/railway-data";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Ambulance, Flame, Shield, Timer, MapPin, Wrench } from "lucide-react";
import { motion } from "framer-motion";
import { RailwayMap } from "@/components/RailwayMap";
import { collection, onSnapshot, setDoc, doc } from "firebase/firestore";
import { db } from "@/integrations/firebase/client";

export const Route = createFileRoute("/_authenticated/emergency")({ component: Emergency });

function useCountdown(start: number) {
  const [n, setN] = useState(start);
  useEffect(() => { const i = setInterval(() => setN((v) => (v > 0 ? v - 1 : 0)), 1000); return () => clearInterval(i); }, []);
  return n;
}

function Emergency() {
  const [incidents, setIncidents] = useState<any[]>([]);
  const [activeIncident, setActiveIncident] = useState<string | null>(null);
  const [dispatched, setDispatched] = useState<Record<string, { hospital?: boolean; fire?: boolean; police?: boolean; engineer?: boolean }>>({});
  
  useEffect(() => {
    getIncidents().then(data => {
      setIncidents(data);
    });

    const unsub = onSnapshot(collection(db, "emergency_dispatches"), (snapshot) => {
      const dispatchState: any = {};
      snapshot.forEach(doc => {
        dispatchState[doc.id] = doc.data();
      });
      setDispatched(dispatchState);
    });

    return () => unsub();
  }, []);
  const eta = useCountdown(485);

  const handleDispatch = async (incidentId: string, service: 'hospital' | 'fire' | 'police' | 'engineer') => {
    try {
      await setDoc(doc(db, "emergency_dispatches", incidentId), {
        [service]: true
      }, { merge: true });
      toast.success(`${service.toUpperCase()} dispatched to incident ${incidentId}.`);
    } catch (e: any) {
      toast.error(`Dispatch failed: ${e.message}`);
    }
  };

  return (
    <div className="p-6 lg:p-8 max-w-[1600px] mx-auto">
      <PageHeader eyebrow="Emergency Response" title="Incident Command" description="Real-time coordination of medical, fire, and police response across active incidents." />
      <div className="grid lg:grid-cols-[1.4fr_1fr] gap-4">
        <Card className="glass border-border/60 overflow-hidden h-[480px]">
          <RailwayMap height="100%" focusId={activeIncident} />
        </Card>
        <div className="space-y-3 overflow-y-auto max-h-[480px]">
          {incidents.map((i, idx) => (
            <motion.div key={i.id} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.05 }}>
              <Card 
                className={`glass border-border/60 p-4 cursor-pointer transition-colors ${activeIncident === i.id ? 'bg-primary/5 border-primary/50' : ''} ${i.severity === "critical" ? "border-[var(--critical)]/60 animate-pulse-emergency" : ""}`}
                onClick={() => setActiveIncident(i.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="font-bold">{i.incident_type}</div>
                  <Badge variant="outline" className="text-[10px] uppercase border-[var(--critical)]/50 text-[var(--critical)]">{i.severity}</Badge>
                </div>
                <div className="text-xs text-muted-foreground mt-1">{i.description}</div>
                <div className="text-[10px] mt-2 font-mono flex items-center gap-1 text-muted-foreground">
                  <MapPin className="w-3 h-3" />{i.latitude.toFixed(3)}, {i.longitude.toFixed(3)}
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <DispatchButton 
                    active={dispatched[i.id]?.hospital} 
                    icon={Ambulance} 
                    label="Hospital" 
                    onClick={(e: any) => { e.stopPropagation(); handleDispatch(i.id, 'hospital'); }} 
                  />
                  <DispatchButton 
                    active={dispatched[i.id]?.fire} 
                    icon={Flame} 
                    label="Fire" 
                    onClick={(e: any) => { e.stopPropagation(); handleDispatch(i.id, 'fire'); }} 
                  />
                  <DispatchButton 
                    active={dispatched[i.id]?.police} 
                    icon={Shield} 
                    label="Police" 
                    onClick={(e: any) => { e.stopPropagation(); handleDispatch(i.id, 'police'); }} 
                  />
                  <DispatchButton 
                    active={dispatched[i.id]?.engineer} 
                    icon={Wrench} 
                    label="Engineers" 
                    onClick={(e: any) => { e.stopPropagation(); handleDispatch(i.id, 'engineer'); }} 
                  />
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4 mt-6">
        <Card className="glass border-border/60 p-5">
          <div className="flex items-center gap-2 text-sm"><Timer className="w-4 h-4 text-primary" />Ambulance ETA</div>
          <div className="text-4xl font-extrabold font-mono mt-2 text-[var(--critical)]">
            {Math.floor(eta / 60)}:{String(eta % 60).padStart(2, "0")}
          </div>
          <div className="text-xs text-muted-foreground mt-1">Hospital → Site of HWH fire incident</div>
        </Card>
        <Card className="glass border-border/60 p-5">
          <div className="text-sm font-semibold">Optimized rescue route</div>
          <ul className="mt-2 space-y-1.5 text-xs text-muted-foreground">
            <li>1. NH19 southbound — clear</li>
            <li>2. Service road → Track access gate 4</li>
            <li>3. Foot patrol — last 120m</li>
          </ul>
        </Card>
        <Card className="glass border-border/60 p-5">
          <div className="text-sm font-semibold">Resources dispatched</div>
          <div className="grid grid-cols-3 gap-2 mt-2 text-center">
            <ResourceCount n="04" label="Ambulance" />
            <ResourceCount n="02" label="Fire" />
            <ResourceCount n="06" label="Police" />
          </div>
        </Card>
      </div>
    </div>
  );
}

function DispatchButton({ active, icon: Icon, label, onClick }: any) {
  return (
    <button 
      onClick={active ? undefined : onClick}
      disabled={active}
      className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] uppercase tracking-wider transition-all ${
        active ? "bg-[var(--success)]/15 text-[var(--success)] border border-[var(--success)]/30 cursor-default" :
        "bg-white/5 text-muted-foreground border border-border/60 hover:bg-white/10 hover:text-white cursor-pointer"
      }`}
    >
      <Icon className="w-3 h-3" />
      {active ? `${label} (Dispatched)` : `Dispatch ${label}`}
    </button>
  );
}
function ResourceCount({ n, label }: any) {
  return <div className="bg-white/5 rounded p-2"><div className="text-xl font-mono font-bold">{n}</div><div className="text-[9px] uppercase tracking-wider text-muted-foreground">{label}</div></div>;
}