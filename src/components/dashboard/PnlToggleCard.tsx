"use client";

import { useState } from "react";
import { TrendingUp } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface PnlToggleCardProps {
  pnl: number;
  winCount: number;
  lossCount: number;
  /** Current account balance from MT5. Initial capital is derived as balance − pnl. */
  accountBalance: number | null;
}

export function PnlToggleCard({ pnl, winCount, lossCount, accountBalance }: PnlToggleCardProps) {
  const [showPct, setShowPct] = useState(false);

  // Derive initial capital: current balance minus all P&L accrued
  const initialCapital =
    accountBalance != null && accountBalance > 0 ? accountBalance - pnl : null;
  const pnlPct =
    initialCapital != null && initialCapital > 0
      ? (pnl / initialCapital) * 100
      : null;

  const highlight = pnl > 0 ? "green" : pnl < 0 ? "red" : "default";

  const borderStyle = {
    green: "border-emerald-500/20 bg-emerald-500/5 hover:border-emerald-500/40 hover:bg-emerald-500/10",
    red: "border-red-500/20 bg-red-500/5 hover:border-red-500/40 hover:bg-red-500/10",
    default: "border-zinc-800 bg-zinc-900/60 hover:border-zinc-700 hover:bg-zinc-800/60",
  }[highlight];

  const valueColor = {
    green: "text-emerald-400",
    red: "text-red-400",
    default: "text-zinc-50",
  }[highlight];

  return (
    <Link
      href="/journal"
      className={cn(
        "group rounded-xl border p-5 transition-all duration-200 cursor-pointer",
        "hover:scale-[1.02] hover:shadow-lg hover:shadow-black/20",
        borderStyle
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">Net P&L</p>
        <div className="flex items-center gap-2">
          {/* Toggle button — only shown when % is computable */}
          {pnlPct !== null && (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowPct((v) => !v);
              }}
              className={cn(
                "rounded-md border px-1.5 py-0.5 text-[10px] font-bold transition-colors",
                showPct
                  ? "border-indigo-500/50 bg-indigo-500/10 text-indigo-400"
                  : "border-zinc-700 text-zinc-400 hover:border-indigo-500/50 hover:text-indigo-400"
              )}
              title={showPct ? "Switch to cash" : "Switch to percentage"}
            >
              {showPct ? "$" : "%"}
            </button>
          )}
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-zinc-800">
            <TrendingUp className="h-3.5 w-3.5 text-zinc-400" />
          </div>
        </div>
      </div>

      {/* Main value — animates between $ and % */}
      <p className={cn("text-2xl font-bold tracking-tight", valueColor)}>
        {showPct && pnlPct !== null
          ? `${pnl >= 0 ? "+" : ""}${pnlPct.toFixed(2)}%`
          : formatCurrency(pnl)}
      </p>

      <p className="mt-1 text-xs text-zinc-500">
        {winCount}W · {lossCount}L
        {showPct && initialCapital != null
          ? ` · base ${formatCurrency(Math.round(initialCapital))}`
          : ""}
      </p>

      <p className="mt-3 text-[11px] text-zinc-600 group-hover:text-indigo-400 transition-colors">
        View details →
      </p>
    </Link>
  );
}
