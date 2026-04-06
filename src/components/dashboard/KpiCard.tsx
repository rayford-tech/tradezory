import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";

interface KpiCardProps {
  title: string;
  value: string;
  subtitle?: string;
  trend?: "up" | "down" | "neutral";
  icon?: LucideIcon;
  highlight?: "green" | "red" | "blue" | "default";
  href?: string;
  className?: string;
}

export function KpiCard({
  title,
  value,
  subtitle,
  trend,
  icon: Icon,
  highlight = "default",
  href,
  className,
}: KpiCardProps) {
  const highlightStyles = {
    green: "border-emerald-500/20 bg-emerald-500/5",
    red: "border-red-500/20 bg-red-500/5",
    blue: "border-indigo-500/20 bg-indigo-500/5",
    default: "border-zinc-800 bg-zinc-900/60",
  };

  const hoverStyles = {
    green: "hover:border-emerald-500/40 hover:bg-emerald-500/10",
    red: "hover:border-red-500/40 hover:bg-red-500/10",
    blue: "hover:border-indigo-500/40 hover:bg-indigo-500/10",
    default: "hover:border-zinc-700 hover:bg-zinc-800/60",
  };

  const valueStyles = {
    green: "text-emerald-400",
    red: "text-red-400",
    blue: "text-indigo-400",
    default: "text-zinc-50",
  };

  const trendColor =
    trend === "up" ? "text-emerald-400" : trend === "down" ? "text-red-400" : "text-zinc-400";

  const inner = (
    <>
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
        <p className={cn("mt-1 text-xs", trendColor !== "text-zinc-400" ? trendColor : "text-zinc-500")}>
          {subtitle}
        </p>
      )}
      {href && (
        <p className="mt-3 text-[11px] text-zinc-600 group-hover:text-indigo-400 transition-colors">
          View details →
        </p>
      )}
    </>
  );

  const baseClass = cn(
    "group rounded-xl border p-5 transition-all duration-200",
    highlightStyles[highlight],
    hoverStyles[highlight],
    href && "hover:scale-[1.02] hover:shadow-lg hover:shadow-black/20 cursor-pointer",
    className
  );

  if (href) {
    return (
      <Link href={href} className={baseClass}>
        {inner}
      </Link>
    );
  }

  return <div className={baseClass}>{inner}</div>;
}
