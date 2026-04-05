import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatPercent(value: number): string {
  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
}

export function formatRR(value: number): string {
  return `${value.toFixed(2)}R`;
}

export function pnlColor(value: number): string {
  if (value > 0) return "text-emerald-400";
  if (value < 0) return "text-red-400";
  return "text-zinc-400";
}

export function pnlBg(value: number): string {
  if (value > 0) return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
  if (value < 0) return "bg-red-500/10 text-red-400 border-red-500/20";
  return "bg-zinc-500/10 text-zinc-400 border-zinc-500/20";
}

export function sessionLabel(session: string): string {
  const map: Record<string, string> = {
    ASIAN: "Asian",
    LONDON: "London",
    NEW_YORK: "New York",
    LONDON_NY_OVERLAP: "London/NY",
  };
  return map[session] ?? session;
}

export function emotionEmoji(emotion: string): string {
  const map: Record<string, string> = {
    CONFIDENT: "💪",
    ANXIOUS: "😰",
    CALM: "😌",
    FEARFUL: "😨",
    GREEDY: "🤑",
    NEUTRAL: "😐",
    FRUSTRATED: "😤",
    EXCITED: "🤩",
  };
  return map[emotion] ?? "🎯";
}
