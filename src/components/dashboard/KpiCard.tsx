import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface KpiCardProps {
  title: string;
  value: string;
  subtitle?: string;
  trend?: "up" | "down" | "neutral";
  icon?: LucideIcon;
  highlight?: "green" | "red" | "blue" | "default";
  className?: string;
}

export function KpiCard({
  title,
  value,
  subtitle,
  trend,
  icon: Icon,
  highlight = "default",
  className,
}: KpiCardProps) {
  const highlightStyles = {
    green: "border-emerald-500/20 bg-emerald-500/5",
    red: "border-red-500/20 bg-red-500/5",
    blue: "border-indigo-500/20 bg-indigo-500/5",
    default: "border-zinc-800 bg-zinc-900/60",
  };

  const valueStyles = {
    green: "text-emerald-400",
    red: "text-red-400",
    blue: "text-indigo-400",
    default: "text-zinc-50",
  };

  const trendColor =
    trend === "up" ? "text-emerald-400" : trend === "down" ? "text-red-400" : "text-zinc-400";

  return (
    <div
      className={cn(
        "rounded-xl border p-5 transition-all hover:border-zinc-700",
        highlightStyles[highlight],
        className
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">{title}</p>
        {Icon && (
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-zinc-800">
            <Icon className="h-3.5 w-3.5 text-zinc-400" />
          </div>
        )}
      </div>
      <p className={cn("text-2xl font-bold tracking-tight", valueStyles[highlight])}>{value}</p>
      {subtitle && (
        <p className={cn("mt-1 text-xs", trendColor)}>{subtitle}</p>
      )}
    </div>
  );
}
