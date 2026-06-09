import { Link, Outlet, useRouterState } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  LayoutDashboard, Map, Plane, Search, Wrench, Siren, CloudRain, HeartPulse,
  LogOut, Bell, TrainFront, Shield,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useEmergencyEngine } from "@/hooks/use-emergency-engine";
import { useMatlabSync } from "@/hooks/use-matlab-sync";
import { AIAssistant } from "@/components/AIAssistant";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getIncidents, getTrackDefects } from "@/lib/railway-data";
import { useEffect, useState } from "react";

const NAV = [
  { to: "/dashboard", label: "Command Center", icon: LayoutDashboard },
  { to: "/digital-twin", label: "Digital Twin", icon: Map },
  { to: "/drones", label: "Drone Ops", icon: Plane },
  { to: "/inspection", label: "Track Inspection", icon: Search },
  { to: "/repair", label: "Repair Intelligence", icon: Wrench },
  { to: "/emergency", label: "Emergency Response", icon: Siren },
  { to: "/health", label: "Railway Health", icon: HeartPulse },
];

export function AppShell() {
  const { user, roles, signOut } = useAuth();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  useEmergencyEngine();
  useMatlabSync();

  const [notifications, setNotifications] = useState<any[]>([]);
  useEffect(() => {
    Promise.all([getIncidents(), getTrackDefects()]).then(([incidents, defects]) => {
      const notifs = [
        ...incidents.map(i => ({ id: i.id, title: i.incident_type, desc: i.description, severity: i.severity, time: i.created_at, type: 'incident' })),
        ...defects.map(d => ({ id: d.id, title: d.defect_type, desc: d.section_name, severity: d.severity, time: d.detected_at, type: 'defect' }))
      ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
      setNotifications(notifs);
    });
  }, []);

  return (
    <div className="flex min-h-screen w-full bg-background text-foreground">
      {/* Sidebar */}
      <aside className="hidden lg:flex w-64 shrink-0 flex-col border-r border-border/60 glass">
        <div className="px-6 py-6 flex items-center gap-3 border-b border-border/60">
          <div className="relative">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "var(--gradient-primary)" }}>
              <TrainFront className="w-5 h-5 text-white" />
            </div>
            <div className="absolute inset-0 rounded-xl glow-ring opacity-60 pointer-events-none" />
          </div>
          <div>
            <div className="font-extrabold tracking-tight text-lg leading-none flex flex-col">
              <div>RailOne<span className="text-gradient-primary">AI</span></div>
              <div className="text-[9px] text-muted-foreground uppercase font-normal tracking-widest mt-0.5">Eastern Railway</div>
            </div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground mt-1">Command Center</div>
          </div>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {NAV.map((n) => {
            const active = pathname === n.to;
            return (
              <Link key={n.to} to={n.to}
                className={`group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all ${
                  active
                    ? "bg-primary/15 text-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                }`}>
                {active && (
                  <motion.span layoutId="nav-pill" className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-full" style={{ background: "var(--gradient-primary)" }} />
                )}
                <n.icon className="w-4 h-4" />
                <span className="font-medium">{n.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="p-3 border-t border-border/60">
          <div className="flex items-center gap-3 px-2 py-2">
            <Avatar className="w-9 h-9 border border-border">
              <AvatarFallback className="bg-primary/20 text-foreground text-xs">
                {user?.email?.[0]?.toUpperCase() ?? "U"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold truncate">{user?.email}</div>
              <div className="flex gap-1 mt-0.5">
                {(roles.length ? roles : (["railway_operator"] as const)).slice(0, 1).map((r) => (
                  <Badge key={r} variant="outline" className="text-[9px] px-1.5 py-0 border-primary/40 text-primary">
                    <Shield className="w-2.5 h-2.5 mr-1" />{r.replace("_", " ")}
                  </Badge>
                ))}
              </div>
            </div>
            <button onClick={signOut} className="text-muted-foreground hover:text-foreground transition-colors" aria-label="Sign out">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="h-14 px-4 lg:px-8 border-b border-border/60 flex items-center justify-between glass sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <div className="lg:hidden flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "var(--gradient-primary)" }}>
                <TrainFront className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold">RailOneAI: ER</span>
              <span className="text-muted-foreground">· Autonomous Command</span>
            </div>
            <div className="hidden md:flex items-center gap-2 text-xs text-muted-foreground">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--success)] animate-pulse" />
              All Systems Online · <span className="font-mono">{new Date().toUTCString().slice(17, 25)} UTC</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Popover>
              <PopoverTrigger asChild>
                <button className="relative p-2 rounded-lg hover:bg-white/5 transition-colors">
                  <Bell className="w-4 h-4" />
                  {notifications.length > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[var(--critical)] animate-pulse-emergency" />
                  )}
                </button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-80 p-0 glass border-border/60 shadow-2xl">
                <div className="p-3 border-b border-border/60 bg-muted/20 flex justify-between items-center">
                  <h3 className="font-semibold text-sm">Notifications</h3>
                  <Badge variant="secondary" className="text-[10px]">{notifications.length} Unread</Badge>
                </div>
                <ScrollArea className="h-[300px]">
                  {notifications.length === 0 ? (
                    <div className="p-4 text-center text-sm text-muted-foreground">No new notifications</div>
                  ) : (
                    <div className="flex flex-col">
                      {notifications.map(n => (
                        <div key={n.id} className="p-3 border-b border-border/40 hover:bg-white/5 transition-colors cursor-pointer">
                          <div className="flex justify-between items-start gap-2">
                            <div className="font-medium text-xs text-foreground">{n.title}</div>
                            <Badge variant="outline" className={`text-[9px] uppercase px-1 py-0 ${n.severity === 'critical' ? 'border-[var(--critical)] text-[var(--critical)]' : 'border-[var(--warning)] text-[var(--warning)]'}`}>
                              {n.severity}
                            </Badge>
                          </div>
                          <div className="text-[11px] text-muted-foreground mt-1 line-clamp-2">{n.desc}</div>
                          <div className="text-[9px] text-muted-foreground mt-2 font-mono">{new Date(n.time).toLocaleTimeString()}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </PopoverContent>
            </Popover>
          </div>
        </header>
        {/* Mobile nav */}
        <nav className="lg:hidden flex gap-1 overflow-x-auto px-3 py-2 border-b border-border/60 glass scrollbar-none">
          {NAV.map((n) => {
            const active = pathname === n.to;
            return (
              <Link key={n.to} to={n.to} className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${
                active ? "bg-primary/20 text-foreground" : "text-muted-foreground"
              }`}>
                <n.icon className="w-3.5 h-3.5" />{n.label}
              </Link>
            );
          })}
        </nav>
        <main className="flex-1 overflow-y-auto relative">
          <Outlet />
        </main>
      </div>
      <AIAssistant />
    </div>
  );
}