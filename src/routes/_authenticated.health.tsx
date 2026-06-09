import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { getERTrains, getStationHealth } from "@/lib/railway-data";
import { askGemini } from "@/lib/gemini";
import { Loader2, Bot } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";
import { RadialBarChart, RadialBar, ResponsiveContainer, PolarAngleAxis } from "recharts";

export const Route = createFileRoute("/_authenticated/health")({ component: Health });

function Health() {
  const [sections, setSections] = useState<any[]>([]);
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [loadingAi, setLoadingAi] = useState(true);

  useEffect(() => { 
    async function load() {
      try {
        const trains = await getERTrains();
        const scs = trains.map(t => {
          const h = getStationHealth(t.properties.number);
          return {
            id: t.properties.number,
            section_name: `Route ${t.properties.from_station_name} - ${t.properties.to_station_name}`,
            health_score: h.score,
          };
        }).sort((a, b) => a.health_score - b.health_score).slice(0, 8); // Top 8 worst sections
        setSections(scs);

        const prompt = `Based on these lowest scoring railway sections: ${JSON.stringify(scs)}, generate a 2-sentence executive summary of the network's current structural risk and what immediate maintenance action is required. Do not use conversational filler, just the analysis.`;
        const insight = await askGemini(prompt, "");
        setAiInsight(insight);
      } catch(e) {
        console.error(e);
      } finally {
        setLoadingAi(false);
      }
    }
    load();
  }, []);

  const avg = sections.length ? Math.round(sections.reduce((s, r) => s + r.health_score, 0) / sections.length) : 0;
  const gaugeData = [{ name: "score", value: avg, fill: avg > 75 ? "#22c55e" : avg > 55 ? "#eab308" : "#ef4444" }];

  const cats = [
    { name: "Track Health", value: 78 },
    { name: "Signal Health", value: 91 },
    { name: "Station Health", value: 84 },
    { name: "Weather Risk", value: 62 },
  ];

  return (
    <div className="p-6 lg:p-8 max-w-[1600px] mx-auto">
      <PageHeader eyebrow="Railway Health" title="Network Integrity Index" description="Composite health score across track, signal, station and weather subsystems." />
      <div className="grid lg:grid-cols-[1fr_1.4fr] gap-4">
        <Card className="glass border-border/60 p-6 flex flex-col items-center justify-center relative overflow-hidden">
          <div className="absolute inset-0" style={{ background: "var(--gradient-glow)" }} />
          <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Overall Score</div>
          <div className="relative w-64 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart innerRadius="80%" outerRadius="100%" data={gaugeData} startAngle={220} endAngle={-40}>
                <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
                <RadialBar background={{ fill: "#1f1f2a" }} dataKey="value" cornerRadius={20} />
              </RadialBarChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-6xl font-black font-mono">{avg}</motion.div>
              <div className="text-xs text-muted-foreground">out of 100</div>
            </div>
          </div>
          <div className="mt-2 text-sm font-semibold" style={{ color: gaugeData[0].fill }}>
            {avg > 75 ? "EXCELLENT" : avg > 55 ? "OPERATIONAL" : "ATTENTION REQUIRED"}
          </div>
        </Card>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {cats.map((c, i) => (
              <Card key={c.name} className="glass border-border/60 p-4">
                <div className="text-xs text-muted-foreground">{c.name}</div>
                <div className="text-3xl font-extrabold mt-1">{c.value}</div>
                <motion.div initial={{ width: 0 }} animate={{ width: `${c.value}%` }} transition={{ duration: 0.8, delay: i * 0.1 }}
                  className="h-1 mt-2 rounded-full" style={{ background: "var(--gradient-primary)" }} />
              </Card>
            ))}
          </div>
          <Card className="glass border-border/60 p-4">
            <div className="font-bold mb-2 text-sm">Critical Section Breakdown</div>
            <div className="space-y-2">
              {sections.map((s, i) => (
                <motion.div key={s.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
                  className="flex items-center gap-3 text-sm">
                  <div className="w-48 text-xs truncate" title={s.section_name}>{s.section_name}</div>
                  <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{
                      width: `${s.health_score}%`,
                      background: s.health_score > 75 ? "#22c55e" : s.health_score > 55 ? "#eab308" : "#ef4444",
                    }} />
                  </div>
                  <div className="font-mono text-xs w-10 text-right">{s.health_score}</div>
                </motion.div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="mt-4">
        <Card className="glass border-border/60 p-5 border-l-4 border-l-primary relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Bot className="w-24 h-24" />
          </div>
          <div className="flex items-center gap-2 mb-2 text-primary font-bold">
            <Bot className="w-5 h-5" />
            <h3>RailOneAI Executive Insight</h3>
          </div>
          {loadingAi ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
              <Loader2 className="w-4 h-4 animate-spin" /> Engine analyzing section integrity...
            </div>
          ) : (
            <p className="text-sm leading-relaxed text-foreground/90 max-w-4xl relative z-10">
              {aiInsight}
            </p>
          )}
        </Card>
      </motion.div>
    </div>
  );
}