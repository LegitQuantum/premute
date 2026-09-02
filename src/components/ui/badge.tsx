import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Badge({
  className,
  tone = "muted",
  children,
}: {
  className?: string;
  tone?: "muted" | "accent" | "danger" | "success" | "warn" | "gold" | "silver" | "bronze";
  children: ReactNode;
}) {
  const tones: Record<string, string> = {
    muted: "bg-elevated text-muted border-border",
    accent: "bg-accent/15 text-accent border-accent/25",
    danger: "bg-danger/15 text-danger border-danger/25",
    success: "bg-success/15 text-success border-success/25",
    warn: "bg-warn/15 text-warn border-warn/25",
    gold: "bg-gold/15 text-gold border-gold/25",
    silver: "bg-silver/15 text-silver border-silver/25",
    bronze: "bg-bronze/15 text-bronze border-bronze/25",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
