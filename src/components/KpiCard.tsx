import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";

interface Props {
  label: string;
  value: string | number;
  delta?: string;
  trend?: "up" | "down" | "neutral";
  icon: LucideIcon;
  tone?: "primary" | "success" | "warning" | "critical";
  pulse?: boolean;
}

const toneRing = {
  primary: "from-primary/30 to-secondary/30",
  success: "from-[var(--success)]/30 to-emerald-500/20",
  warning: "from-[var(--warning)]/30 to-amber-500/20",
  critical: "from-[var(--critical)]/40 to-red-600/30",
};

export function KpiCard({ label, value, delta, trend, icon: Icon, tone = "primary", pulse }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      whileHover={{ y: -2 }}
    >
      <Card className={`relative overflow-hidden glass border-border/60 p-5 ${pulse ? "animate-pulse-emergency" : ""}`}>
        <div className={`absolute -top-12 -right-12 w-40 h-40 rounded-full bg-gradient-to-br ${toneRing[tone]} blur-2xl opacity-60`} />
        <div className="relative">
          <div className="flex items-start justify-between">
            <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground font-medium">{label}</div>
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center bg-gradient-to-br ${toneRing[tone]} border border-white/10`}>
              <Icon className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-3xl font-extrabold tracking-tight">{value}</div>
          {delta && (
            <div className={`mt-1 text-xs font-medium ${
              trend === "up" ? "text-[var(--success)]" : trend === "down" ? "text-[var(--critical)]" : "text-muted-foreground"
            }`}>
              {delta}
            </div>
          )}
        </div>
      </Card>
    </motion.div>
  );
}