import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { TrainFront, ShieldCheck, Radar, Plane, Siren, ArrowRight, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "RailOneAI: Eastern Railway (ER)" },
      { name: "description", content: "Digital Twin and Predictive Maintenance Platform for Eastern Railway." },
      { property: "og:title", content: "RailOneAI: Eastern Railway (ER)" },
      { property: "og:description", content: "AI-powered railway operations: drone inspection, defect prediction, emergency response, and live digital twin." },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen overflow-hidden relative">
      {/* Backdrop */}
      <div className="absolute inset-0 -z-10" style={{ background: "var(--gradient-glow)" }} />
      <div className="absolute inset-0 -z-10 opacity-[0.07]" style={{
        backgroundImage: "linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)",
        backgroundSize: "48px 48px",
      }} />

      <header className="px-6 lg:px-12 py-5 flex items-center justify-between">
        <div className="flex items-center gap-3 animate-fade-in">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center shadow-lg shadow-primary/20">
            <TrainFront className="w-5 h-5 text-white" />
          </div>
          <div className="font-extrabold text-lg flex items-center gap-1">RailOne<span className="text-gradient-primary">AI:</span> ER</div>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/auth"><Button variant="ghost" size="sm">Sign in</Button></Link>
          <Link to="/auth"><Button size="sm" className="bg-primary hover:bg-secondary">Launch Console</Button></Link>
        </div>
      </header>

      <section className="px-6 lg:px-12 pt-12 lg:pt-20 pb-24 max-w-6xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] uppercase tracking-[0.25em] glass mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--success)] animate-pulse" />
            Live · Operational
          </div>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight mb-8">
            <span className="text-gradient-primary drop-shadow-sm block mb-2">RailOneAI</span>
            Eastern Railway <br className="hidden md:block" />
            <span className="text-white/90">Operations Platform</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-12 leading-relaxed">
            AI-driven predictive maintenance, drone inspections, and real-time operational intelligence for ER assets.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/auth">
              <Button size="lg" className="bg-primary hover:bg-secondary text-base h-12 px-6">
                Enter Command Center <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
            <Link to="/auth">
              <Button size="lg" variant="outline" className="h-12 px-6 border-border/80">Watch live ops</Button>
            </Link>
          </div>
        </motion.div>

        {/* Feature grid */}
        <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: Radar, label: "Digital Twin", v: "Live" },
            { icon: Plane, label: "Drone Fleet", v: "6 active" },
            { icon: ShieldCheck, label: "Health Score", v: "78/100" },
            { icon: Siren, label: "Open Incidents", v: "5" },
          ].map((f, i) => (
            <motion.div key={f.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + i * 0.08 }}
              className="glass rounded-xl p-4 border border-border/60">
              <f.icon className="w-5 h-5 text-primary" />
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground mt-3">{f.label}</div>
              <div className="text-2xl font-bold mt-1 font-mono">{f.v}</div>
            </motion.div>
          ))}
        </div>

        {/* Activity ticker */}
        <div className="mt-16 glass rounded-xl border border-border/60 overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-2 border-b border-border/60 text-[10px] uppercase tracking-widest text-muted-foreground">
            <Activity className="w-3 h-3 text-primary" /> Live operations feed
          </div>
          <div className="overflow-hidden whitespace-nowrap py-2.5">
            <div className="inline-block animate-ticker text-xs font-mono">
              {Array(2).fill(0).map((_, idx) => (
                <span key={idx}>
                  <span className="px-6">🟢 SkyEye-01 patrol NDLS-GZB · 87% battery</span>
                  <span className="px-6 text-[var(--critical)]">🔴 Rail crack detected · NDLS-GZB Sec 4 · critical</span>
                  <span className="px-6">🟡 Loose fishplate · WR-BCT-CSTM · medium</span>
                  <span className="px-6 text-[var(--critical)]">🚨 Fire on coach S-7 · emergency teams dispatched</span>
                  <span className="px-6">🟢 Health score: Eastern Network 82/100</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
