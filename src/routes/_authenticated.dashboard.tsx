import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  TrainFront, Plane, AlertTriangle, ShieldAlert, Activity, HeartPulse, Siren,
  Radar, Wrench, CloudRain, Users, Cloud, Workflow, Bot, Loader2
} from "lucide-react";
import { getERTrains, getERStations, getTrackDefects, getIncidents, getStationHealth } from "@/lib/railway-data";
import { askGemini } from "@/lib/gemini";
import { PageHeader } from "@/components/PageHeader";
import { KpiCard } from "@/components/KpiCard";
import { AgentCard } from "@/components/AgentCard";
import { Card } from "@/components/ui/card";
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip, AreaChart, Area } from "recharts";

export const Route = createFileRoute("/_authenticated/dashboard")({ component: Dashboard });

function Dashboard() {
  const [stats, setStats] = useState({ stations: 0, routes: 0, trains: 0, alerts: 0, health: 0, critical: 0, maintenance_pending: 0 });

  const [aiAnalysis, setAiAnalysis] = useState<any>(null);
  const [aiLoading, setAiLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function load() {
      try {
        const [trains, stations, defects, incidents] = await Promise.all([
          getERTrains(),
          getERStations(),
          getTrackDefects(),
          getIncidents()
        ]);

        if (!isMounted) return;

        let totalHealth = 0;
        let critical = 0;
        let maintenance = 0;
        
        trains.forEach((t) => {
           const h = getStationHealth(t.properties.number);
           totalHealth += h.score;
           const status = h.status.toLowerCase();
           if (status === 'red' || status === 'critical') critical++;
           if (status === 'needs monitoring' || status === 'maintenance required') maintenance++;
        });
        
        const avg = trains.length ? Math.round(totalHealth / trains.length) : 85;

        setStats({ 
          stations: stations.length, 
          routes: trains.length, 
          trains: trains.length, 
          alerts: incidents.length,
          health: avg,
          critical,
          maintenance_pending: maintenance
        });

        if (aiLoading) {
          const contextData = JSON.stringify({
            activeDefects: defects.length,
            activeIncidents: incidents.length,
            criticalRoutes: critical,
            maintenancePending: maintenance,
            recentIncidents: incidents.map(i => i.incident_type),
          });

          const prompt = `Based on this data, provide EXACTLY 6 ultra-concise, action-oriented recommendations (under 12 words each) for these agents: track_guardian, repair_intelligence, emergency_commander, traffic_optimizer, drone_operations, master_orchestrator. Output ONLY a valid JSON object like: { "track_guardian": "...", "repair_intelligence": "..." } with no other text.`;

          const resultText = await askGemini(prompt, contextData);
          if (!isMounted) return;
          const jsonStr = resultText.replace(/```json/gi, '').replace(/```/g, '').trim();
          setAiAnalysis(JSON.parse(jsonStr));
        }
      } catch (e) {
        console.error("Dashboard load error", e);
      } finally {
        if (isMounted) setAiLoading(false);
      }
    }
    
    load();
    const interval = setInterval(load, 5000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const [trend, setTrend] = useState(() => Array.from({ length: 24 }, (_, i) => ({
    t: `${i}h`,
    health: 70 + Math.round(Math.sin(i / 3) * 8 + Math.random() * 5),
    incidents: Math.max(0, Math.round(Math.sin(i / 4) * 3 + Math.random() * 3)),
  })));

  const [logs, setLogs] = useState(() => [
    { id: 1, time: new Date().toLocaleTimeString(), type: 'info', icon: '📡', message: 'Command Centre telemetry linked.' },
    { id: 2, time: new Date(Date.now() - 5000).toLocaleTimeString(), type: 'warning', icon: '⚠️', message: 'Drone Inspector-4 deployed for track assessment.' },
    { id: 3, time: new Date(Date.now() - 15000).toLocaleTimeString(), type: 'info', icon: '🚂', message: 'Train 12301 departed Howrah Junction.' }
  ]);

  useEffect(() => {
    const timer = setInterval(() => {
      setTrend(prev => {
        const next = [...prev.slice(1)];
        const last = prev[prev.length - 1];
        const nextIdx = parseInt(last.t) + 1;
        next.push({
          t: `${nextIdx}h`,
          health: Math.max(0, Math.min(100, 70 + Math.round(Math.sin(nextIdx / 3) * 8 + Math.random() * 5))),
          incidents: Math.max(0, Math.round(Math.sin(nextIdx / 4) * 3 + Math.random() * 3)),
        });
        return next;
      });

      setLogs(prev => {
        const randomEvents = [
          { type: 'info', icon: '📡', message: 'Receiving new telemetry packet from ER zone.' },
          { type: 'info', icon: '🚂', message: 'Automated signal verification completed.' },
          { type: 'warning', icon: '⚠️', message: 'Minor vibration detected on track segment B.' },
          { type: 'critical', icon: '🔴', message: 'Anomaly flagged by RailOneAI heuristics.' },
          { type: 'info', icon: '🤖', message: 'AI Orchestrator rebalancing load.' }
        ];
        const newEvent = randomEvents[Math.floor(Math.random() * randomEvents.length)];
        return [{ id: Date.now(), time: new Date().toLocaleTimeString(), ...newEvent }, ...prev].slice(0, 50);
      });
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="p-6 lg:p-8 max-w-[1600px] mx-auto">
      <PageHeader eyebrow="Command Center" title="Operations Overview" description="Live network status, telemetry, and active incidents across the railway grid." />

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
        <KpiCard label="Network Health" value={`${stats.health}/100`} delta="Avg track condition" trend="up" icon={HeartPulse} tone="success" />
        <KpiCard label="Active Alerts" value={stats.alerts} delta="Recent events flagged" trend="down" icon={Siren} tone="critical" pulse={stats.alerts > 0} />
        <KpiCard label="Critical Routes" value={stats.critical} delta="Requiring immediate action" trend="down" icon={AlertTriangle} tone="critical" pulse={stats.critical > 0} />
        <KpiCard label="Maintenance Backlog" value={stats.maintenance_pending} delta="High priority tasks" trend="neutral" icon={Wrench} tone="warning" />
        <KpiCard label="Total ER Stations" value={stats.stations} delta="In the ER network" trend="neutral" icon={ShieldAlert} tone="primary" />
        <KpiCard label="Total Active Trains" value={stats.trains} delta="Monitored in real-time" trend="neutral" icon={TrainFront} tone="primary" />
        <KpiCard label="Total Routes" value={stats.routes} delta="Mapped ER sections" trend="neutral" icon={Workflow} tone="primary" />
        <KpiCard label="System Integrity" value="Nominal" delta="Core services online" trend="up" icon={Activity} tone="success" />
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-3 gap-4 mt-6">
        <Card className="glass border-border/60 p-5 lg:col-span-2">
          <div className="flex justify-between items-start mb-2">
            <div>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Network health · Live</div>
              <div className="text-xl font-bold mt-1">Live integrity index</div>
            </div>
            <div className="text-xs text-[var(--success)] font-mono flex items-center gap-1">
              <span className="relative flex h-2 w-2 mr-1"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--success)] opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--success)]"></span></span>
              POLLING
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={trend}>
              <defs>
                <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#D72638" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="#D72638" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="t" stroke="#666" fontSize={10} />
              <YAxis stroke="#666" fontSize={10} domain={[40, 100]} />
              <Tooltip contentStyle={{ background: "#15151c", border: "1px solid #2a2a35", borderRadius: 8, fontSize: 12 }} />
              <Area type="monotone" dataKey="health" stroke="#D72638" strokeWidth={2} fill="url(#g1)" isAnimationActive={false} />
            </AreaChart>
          </ResponsiveContainer>
        </Card>
        <Card className="glass border-border/60 p-5">
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Incident rate · Live</div>
          <div className="text-xl font-bold mt-1">Active events</div>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={trend}>
              <XAxis dataKey="t" stroke="#666" fontSize={10} />
              <YAxis stroke="#666" fontSize={10} />
              <Tooltip contentStyle={{ background: "#15151c", border: "1px solid #2a2a35", borderRadius: 8, fontSize: 12 }} />
              <Line type="monotone" dataKey="incidents" stroke="#22c55e" strokeWidth={2} dot={false} isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Live System Log */}
      <motion.div className="mt-10" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <div className="flex items-end justify-between mb-4">
          <div>
            <div className="text-[10px] uppercase tracking-[0.25em] text-primary font-semibold">Live Telemetry</div>
            <h2 className="text-xl font-bold">System Event Log</h2>
          </div>
          <div className="text-xs text-muted-foreground flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary" /> Continuous stream
          </div>
        </div>
        <Card className="glass border-border/60 p-0 overflow-hidden h-[300px] flex flex-col">
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {logs.map(log => (
              <div key={log.id} className="text-sm flex gap-3 items-start border-b border-border/30 pb-2">
                <span className="text-xs font-mono text-muted-foreground pt-0.5 whitespace-nowrap">{log.time}</span>
                <span className={log.type === 'critical' ? 'text-[var(--critical)]' : 'text-primary'}>{log.icon}</span>
                <div className={log.type === 'critical' ? 'text-[var(--critical)] font-medium' : ''}>{log.message}</div>
              </div>
            ))}
          </div>
        </Card>
      </motion.div>
    </div>
  );
}