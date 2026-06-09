import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { db } from "@/integrations/firebase/client";
import { getTrackDefects } from "@/lib/railway-data";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Wrench, Users, Truck, Clock } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from "recharts";

export const Route = createFileRoute("/_authenticated/repair")({ component: Repair });

function Repair() {
  const [defects, setDefects] = useState<any[]>([]);
  useEffect(() => { 
    getTrackDefects().then(setDefects); 
  }, []);

  const totalCost = defects.reduce((s, d) => s + Number(d.repair_cost_prediction ?? 0), 0);
  const totalTime = defects.reduce((s, d) => s + (d.repair_time_prediction ?? 0), 0);

  const chartData = defects.slice(0, 8).map((d, i) => ({
    name: d.section_name?.slice(0, 12) ?? `D${i}`,
    cost: Number(d.repair_cost_prediction ?? 0) / 1000,
    sev: d.severity,
  }));

  const sevColor = (s: string) => s === "critical" ? "#ef4444" : s === "high" ? "#f97316" : s === "medium" ? "#eab308" : "#22c55e";

  return (
    <div className="p-6 lg:p-8 max-w-[1600px] mx-auto">
      <PageHeader eyebrow="Repair Intelligence" title="AI Repair Planning" description="Predictive cost, time, and resource allocation for all open defects." />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Stat icon={Wrench} label="Total est. cost" value={`₹${(totalCost / 100000).toFixed(1)}L`} />
        <Stat icon={Clock} label="Total work time" value={`${Math.round(totalTime / 60)} hrs`} />
        <Stat icon={Users} label="Crews required" value={Math.ceil(defects.length / 3).toString()} />
        <Stat icon={Truck} label="Equipment trips" value={(defects.length * 2).toString()} />
      </div>
      <Card className="glass border-border/60 p-5 mb-6">
        <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Cost forecast per section (₹k)</div>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={chartData}>
            <XAxis dataKey="name" stroke="#666" fontSize={10} />
            <YAxis stroke="#666" fontSize={10} />
            <Tooltip contentStyle={{ background: "#15151c", border: "1px solid #2a2a35", borderRadius: 8, fontSize: 12 }} />
            <Bar dataKey="cost" radius={[6, 6, 0, 0]}>
              {chartData.map((d, i) => <Cell key={i} fill={sevColor(d.sev)} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Card>
      <Card className="glass border-border/60 p-5">
        <div className="font-bold mb-3">AI Recommendations</div>
        <ul className="space-y-2 text-sm">
          <li className="flex gap-3 p-3 rounded-md bg-primary/10 border border-primary/20"><span>🤖</span><span>Pre-stage tamping machine + welding crew at Asansol yard for HWH-ASN Sec 4 (critical rail crack). Saves 90 min mobilization.</span></li>
          <li className="flex gap-3 p-3 rounded-md bg-white/5 border border-border/60"><span>🧠</span><span>Batch fishplate + bolt repairs into a single night block on Sealdah main line (00:30-04:00). Avoids 5 separate possessions.</span></li>
          <li className="flex gap-3 p-3 rounded-md bg-white/5 border border-border/60"><span>⚙️</span><span>Defer BWN-HWH corrosion repair by 7 days — predicted progression is slow; aligns with scheduled maintenance window.</span></li>
        </ul>
      </Card>
    </div>
  );
}

function Stat({ icon: Icon, label, value }: any) {
  return (
    <Card className="glass border-border/60 p-4">
      <Icon className="w-5 h-5 text-primary" />
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground mt-3">{label}</div>
      <div className="text-2xl font-extrabold mt-1">{value}</div>
    </Card>
  );
}