"use client";

import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
import type { AnalyticsResult, TradeWithRelations, TradingAccount } from "@/types";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { PnlChart } from "@/components/dashboard/PnlChart";
import { FlaskConical } from "lucide-react";

interface BacktestViewProps {
  analytics: AnalyticsResult;
  trades: TradeWithRelations[];
  accounts: TradingAccount[];
}

export function BacktestView({ analytics, trades, accounts }: BacktestViewProps) {
  if (trades.length === 0) {
    return (
      <div className="space-y-5">
        <div>
          <h1 className="text-xl font-bold text-zinc-50">Backtesting</h1>
          <p className="text-sm text-zinc-400">Test setups with historical simulated trades</p>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-12 text-center">
          <FlaskConical className="h-8 w-8 text-zinc-600 mx-auto mb-3" />
          <p className="text-zinc-400 text-sm">No backtest trades yet</p>
          <p className="text-zinc-500 text-xs mt-1 mb-4">Log trades with type "Backtest" to analyze historical performance</p>
          <Link
            href="/journal/new"
            className="inline-block rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 transition-colors"
          >
            Log Backtest Trade
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-zinc-50">Backtesting</h1>
          <p className="text-sm text-zinc-400">{analytics.totalTrades} backtest trades · {accounts.map((a) => a.name).join(", ")}</p>
        </div>
        <Link href="/journal/new" className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 transition-colors">
          + Log Backtest Trade
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard title="Net P&L" value={formatCurrency(analytics.totalNetPnl)} highlight={analytics.totalNetPnl > 0 ? "green" : "red"} />
        <KpiCard title="Win Rate" value={`${Math.round(analytics.winRate * 100)}%`} highlight={analytics.winRate >= 0.5 ? "green" : "default"} />
        <KpiCard title="Profit Factor" value={analytics.profitFactor === Infinity ? "∞" : analytics.profitFactor.toFixed(2)} />
        <KpiCard title="Total Trades" value={String(analytics.totalTrades)} />
      </div>

      {analytics.equityCurve.length > 0 && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5">
          <h2 className="text-sm font-semibold text-zinc-200 mb-4">Backtest Equity Curve</h2>
          <PnlChart data={analytics.equityCurve} />
        </div>
      )}

      <div className="rounded-xl border border-zinc-800 bg-zinc-900/60">
        <div className="px-5 py-4 border-b border-zinc-800">
          <h2 className="text-sm font-semibold text-zinc-200">Backtest Trades</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800">
                {["Instrument", "Direction", "Entry", "Exit", "P&L", "RR", "Date"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {trades.slice().reverse().map((t) => {
                const pnl = Number(t.netPnl ?? 0);
                return (
                  <tr key={t.id} className="border-b border-zinc-800/60 hover:bg-zinc-800/30">
                    <td className="px-4 py-3 font-medium text-zinc-200">
                      <Link href={`/journal/${t.id}`} className="hover:text-indigo-400">{t.instrument}</Link>
                    </td>
                    <td className={`px-4 py-3 text-xs font-medium ${t.direction === "BUY" ? "text-emerald-400" : "text-red-400"}`}>{t.direction}</td>
                    <td className="px-4 py-3 text-zinc-300 font-mono text-xs">{Number(t.entryPrice).toFixed(5)}</td>
                    <td className="px-4 py-3 text-zinc-300 font-mono text-xs">{t.exitPrice ? Number(t.exitPrice).toFixed(5) : "—"}</td>
                    <td className={`px-4 py-3 font-medium ${pnl > 0 ? "text-emerald-400" : pnl < 0 ? "text-red-400" : "text-zinc-400"}`}>{formatCurrency(pnl)}</td>
                    <td className="px-4 py-3 text-zinc-400 text-xs">{t.rrRatio ? `${Number(t.rrRatio).toFixed(2)}R` : "—"}</td>
                    <td className="px-4 py-3 text-zinc-500 text-xs">{new Date(t.openTime).toLocaleDateString()}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
