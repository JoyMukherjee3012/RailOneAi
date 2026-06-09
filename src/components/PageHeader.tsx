import { motion } from "framer-motion";
import type { ReactNode } from "react";

export function PageHeader({ eyebrow, title, description, actions }: { eyebrow?: string; title: string; description?: string; actions?: ReactNode }) {
  return (
    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="flex flex-wrap items-end justify-between gap-4 mb-6">
      <div>
        {eyebrow && <div className="text-[10px] uppercase tracking-[0.25em] text-primary font-semibold mb-2">{eyebrow}</div>}
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">{title}</h1>
        {description && <p className="text-sm text-muted-foreground mt-1.5 max-w-2xl">{description}</p>}
      </div>
      {actions && <div className="flex gap-2">{actions}</div>}
    </motion.div>
  );
}