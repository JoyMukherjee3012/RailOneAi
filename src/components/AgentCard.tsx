import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

interface Props {
  name: string;
  icon: LucideIcon;
  status: "active" | "monitoring" | "alert" | "idle";
  confidence: number;
  lastAction: string;
  recommendation: string;
}

const statusStyles = {
  active: { color: "var(--success)", label: "ACTIVE" },
  monitoring: { color: "var(--chart-4)", label: "MONITORING" },
  alert: { color: "var(--critical)", label: "ALERT" },
  idle: { color: "var(--muted-foreground)", label: "IDLE" },
};

export function AgentCard({ name, icon: Icon, status, confidence, lastAction, recommendation }: Props) {
  const s = statusStyles[status];
  return (
    <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} whileHover={{ y: -3 }}>
      <Card className="glass border-border/60 p-5 h-full relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-px" style={{ background: `linear-gradient(90deg, transparent, ${s.color}, transparent)` }} />
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center border border-white/10" style={{ background: `radial-gradient(circle at 30% 30%, ${s.color}40, transparent 70%)` }}>
            <Icon className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold leading-tight">{name}</div>
            <Badge className="mt-1 text-[9px] tracking-widest px-1.5 py-0 border" style={{ background: `${s.color}15`, color: s.color, borderColor: `${s.color}40` }}>
              <span className="w-1 h-1 rounded-full mr-1.5 inline-block animate-pulse" style={{ background: s.color }} />
              {s.label}
            </Badge>
          </div>
        </div>
        <div className="mt-4 space-y-2.5">
          <div>
            <div className="flex justify-between text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
              <span>Confidence</span><span className="font-mono">{confidence}%</span>
            </div>
            <Progress value={confidence} className="h-1" />
          </div>
          <div className="text-xs text-muted-foreground">
            <div className="text-[9px] uppercase tracking-widest mb-0.5">Last action</div>
            <div className="text-foreground/80 leading-snug">{lastAction}</div>
          </div>
          <div className="text-xs bg-primary/10 border border-primary/20 rounded-md px-2.5 py-2">
            <div className="text-[9px] uppercase tracking-widest text-primary mb-0.5">Recommendation</div>
            <div className="text-foreground/90 leading-snug">{recommendation}</div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}