"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatCurrency, formatRR } from "@/lib/utils";
import type { AnalyticsResult, TradingAccount, SetupTag, MistakeTag } from "@/types";
import { PnlChart } from "@/components/dashboard/PnlChart";
import { WinRateDonut } from "@/components/dashboard/WinRateDonut";
import { InstrumentBreakdown } from "@/components/dashboard/InstrumentBreakdown";
import { SessionHeatmap } from "@/components/dashboard/SessionHeatmap";
import { Filter, X } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LineChart, Line, ReferenceLine
} from "recharts";

interface Filters {
  dateFrom: string;
  dateTo: string;
  accountId: string;
  assetClass: string;
  direction: string;
}

interface AnalyticsViewProps {
  analytics: AnalyticsResult;
  accounts: TradingAccount[];
  setupTags: SetupTag[];
  mistakeTags: MistakeTag[];
  filters: Filters;
}

function StatRow({ label, value, highlight }: { label: string; value: string; highlight?: "green" | "red" }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-zinc-800/60 last:border-0">
      <span className="text-sm text-zinc-400">{label}</span>
      <span className={`text-sm font-semibold ${highlight === "green" ? "text-emerald-400" : highlight === "red" ? "text-red-400" : "text-zinc-200"}`}>
        {value}
      </span>
    </div>
  );
}

export function AnalyticsView({ analytics, accounts, setupTags, mistakeTags, filters }: AnalyticsViewProps) {
  const router = useRouter();
  const [f, setF] = useState<Filters>(filters);

  const setupData = Object.values(analytics.bySetupTag).sort((a, b) => b.netPnl - a.netPnl);
  const mistakeData = analytics.mistakeFrequency.slice(0, 8);
  const dowData = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"].map((day) => ({
    ...analytics.byDayOfWeek[day],
    day: day.slice(0, 3),
  }));

  function applyFilters(next: Filters) {
    const params = new URLSearchParams();
    if (next.dateFrom) params.set("dateFrom", next.dateFrom);
    if (next.dateTo) params.set("dateTo", next.dateTo);
    if (next.accountId) params.set("accountId", next.accountId);
    if (next.assetClass) params.set("assetClass", next.assetClass);
    if (next.direction) params.set("direction", next.direction);
    router.push(`/analytics?${params.toString()}`);
  }

  function clearFilters() {
    const empty: Filters = { dateFrom: "", dateTo: "", accountId: "", assetClass: "", direction: "" };
    setF(empty);
    router.push("/analytics");
  }

  const hasFilters = f.dateFrom || f.dateTo || f.accountId || f.assetClass || f.direction;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-zinc-50">Analytics</h1>
          <p className="text-sm text-zinc-400">{analytics.totalTrades} closed trades analyzed</p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="h-3.5 w-3.5 text-zinc-500" />
          <span className="text-xs font-medium text-zinc-400">Filter Analytics</span>
          {hasFilters && (
            <button onClick={clearFilters} className="ml-auto flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-300 transition-colors">
              <X className="h-3 w-3" /> Clear
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-zinc-500 uppercase tracking-wider">From</label>
            <input
              type="date"
              value={f.dateFrom}
              onChange={(e) => setF((s) => ({ ...s, dateFrom: e.target.value }))}
              className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-sm text-zinc-200 focus:border-indigo-500 focus:outline-none"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-zinc-500 uppercase tracking-wider">To</label>
            <input
              type="date"
              value={f.dateTo}
              onChange={(e) => setF((s) => ({ ...s, dateTo: e.target.value }))}
              className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-sm text-zinc-200 focus:border-indigo-500 focus:outline-none"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-zinc-500 uppercase tracking-wider">Account</label>
            <select
              value={f.accountId}
              onChange={(e) => setF((s) => ({ ...s, accountId: e.target.value }))}
              className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-sm text-zinc-300 focus:border-indigo-500 focus:outline-none"
            >
              <option value="">All</option>
              {accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-zinc-500 uppercase tracking-wider">Asset Class</label>
            <select
              value={f.assetClass}
              onChange={(e) => setF((s) => ({ ...s, assetClass: e.target.value }))}
              className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-sm text-zinc-300 focus:border-indigo-500 focus:outline-none"
            >
              <option value="">All</option>
              {["FOREX","CRYPTO","STOCKS","INDICES","COMMODITIES","OTHER"].map((ac) => (
                <option key={ac} value={ac}>{ac}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-zinc-500 uppercase tracking-wider">Direction</label>
            <select
              value={f.direction}
              onChange={(e) => setF((s) => ({ ...s, direction: e.target.value }))}
              className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-sm text-zinc-300 focus:border-indigo-500 focus:outline-none"
            >
              <option value="">All</option>
              <option value="BUY">Long</option>
              <option value="SELL">Short</option>
            </select>
          </div>
          <div className="flex flex-col justify-end">
            <button
              onClick={() => applyFilters(f)}
              className="rounded-lg bg-indigo-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-indigo-500 transition-colors"
            >
              Apply
            </button>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5">
          <h2 className="text-sm font-semibold text-zinc-200 mb-3">Performance</h2>
          <StatRow label="Total Net P&L" value={formatCurrency(analytics.totalNetPnl)} highlight={analytics.totalNetPnl > 0 ? "green" : "red"} />
          <StatRow label="Gross Profit" value={formatCurrency(analytics.grossProfit)} highlight="green" />
          <StatRow label="Gross Loss" value={formatCurrency(-analytics.grossLoss)} highlight="red" />
          <StatRow label="Profit Factor" value={analytics.profitFactor === Infinity ? "∞" : analytics.profitFactor.toFixed(2)} highlight={analytics.profitFactor >= 1 ? "green" : "red"} />
          <StatRow label="Expectancy" value={formatCurrency(analytics.expectancy)} highlight={analytics.expectancy > 0 ? "green" : "red"} />
          <StatRow label="Avg Trade" value={formatCurrency(analytics.avgNetPnl)} highlight={analytics.avgNetPnl > 0 ? "green" : "red"} />
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5">
          <h2 className="text-sm font-semibold text-zinc-200 mb-3">Win/Loss Stats</h2>
          <StatRow label="Win Rate" value={`${Math.round(analytics.winRate * 100)}%`} highlight={analytics.winRate >= 0.5 ? "green" : "red"} />
          <StatRow label="Loss Rate" value={`${Math.round(analytics.lossRate * 100)}%`} />
          <StatRow label="Avg Win" value={formatCurrency(analytics.avgWin)} highlight="green" />
          <StatRow label="Avg Loss" value={formatCurrency(-analytics.avgLoss)} highlight="red" />
          <StatRow label="Avg RR" value={formatRR(analytics.avgRR)} />
          <StatRow label="Consec. Wins" value={String(analytics.consecutiveWins)} />
          <StatRow label="Consec. Losses" value={String(analytics.consecutiveLosses)} />
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5">
          <h2 className="text-sm font-semibold text-zinc-200 mb-3">Risk & Discipline</h2>
          <StatRow label="Max Drawdown" value={formatCurrency(analytics.maxDrawdown)} highlight="red" />
          <StatRow label="Max DD %" value={`${analytics.maxDrawdownPct.toFixed(1)}%`} highlight={analytics.maxDrawdownPct > 20 ? "red" : undefined} />
          <StatRow label="Avg Hold" value={`${Math.round(analytics.avgHoldingMinutes)}m`} />
          <StatRow label="Avg Execution" value={`${analytics.avgExecutionScore.toFixed(1)}/10`} />
          <StatRow label="Avg Discipline" value={`${analytics.avgDisciplineScore.toFixed(1)}/10`} />
          <StatRow label="Avg Confidence" value={`${analytics.avgConfidenceScore.toFixed(1)}/10`} />
          {analytics.bestDay && <StatRow label="Best Day" value={formatCurrency(analytics.bestDay.pnl)} highlight="green" />}
          {analytics.worstDay && <StatRow label="Worst Day" value={formatCurrency(analytics.worstDay.pnl)} highlight="red" />}
        </div>
      </div>

      {/* Equity Curve */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5">
        <h2 className="text-sm font-semibold text-zinc-200 mb-1">Equity Curve</h2>
        <p className="text-xs text-zinc-500 mb-4">Cumulative P&L over time</p>
        {analytics.equityCurve.length > 0 ? (
          <PnlChart data={analytics.equityCurve} />
        ) : (
          <p className="text-xs text-zinc-500 text-center py-8">No closed trades</p>
        )}
      </div>

      {/* Drawdown Chart */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5">
        <h2 className="text-sm font-semibold text-zinc-200 mb-1">Drawdown</h2>
        <p className="text-xs text-zinc-500 mb-4">Drawdown from peak equity</p>
        <ResponsiveContainer width="100%" height={120}>
          <LineChart data={analytics.equityCurve} margin={{ top: 5, right: 5, left: 5, bottom: 0 }}>
            <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#71717a" }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
            <YAxis tick={{ fontSize: 10, fill: "#71717a" }} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v >= 1000 ? (v/1000).toFixed(1)+"k" : v}`} width={50} />
            <Tooltip contentStyle={{ background: "#18181b", border: "1px solid #27272a", borderRadius: 8, fontSize: 11 }} />
            <ReferenceLine y={0} stroke="#3f3f46" />
            <Line type="monotone" dataKey="drawdown" stroke="#ef4444" strokeWidth={1.5} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* By Setup Tag + Win Rate */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5">
          <h2 className="text-sm font-semibold text-zinc-200 mb-4">Performance by Setup</h2>
          {setupData.length > 0 ? (
            <div className="space-y-2.5">
              {setupData.map((s) => (
                <div key={s.name} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-300">{s.name}</span>
                    <div className="flex gap-3">
                      <span className="text-zinc-500">{s.trades}t · {Math.round(s.winRate * 100)}% WR</span>
                      <span className={s.netPnl >= 0 ? "text-emerald-400 font-medium" : "text-red-400 font-medium"}>{formatCurrency(s.netPnl)}</span>
                    </div>
                  </div>
                  <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${s.winRate * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-zinc-500 text-center py-6">Tag your trades with setup tags to see performance</p>
          )}
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5">
          <h2 className="text-sm font-semibold text-zinc-200 mb-1">Win/Loss Split</h2>
          <p className="text-xs text-zinc-500 mb-4">{analytics.totalTrades} total trades</p>
          <div className="flex justify-center">
            <WinRateDonut wins={analytics.winCount} losses={analytics.lossCount} breakevens={analytics.breakevenCount} />
          </div>
        </div>
      </div>

      {/* Mistakes impact */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5">
          <h2 className="text-sm font-semibold text-zinc-200 mb-4">Mistake Frequency</h2>
          {mistakeData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={mistakeData} layout="vertical" margin={{ top: 0, right: 10, left: 80, bottom: 0 }}>
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "#a1a1aa" }} tickLine={false} axisLine={false} width={75} />
                <Tooltip contentStyle={{ background: "#18181b", border: "1px solid #27272a", borderRadius: 8, fontSize: 11 }} />
                <Bar dataKey="count" fill="#ef4444" radius={[0, 3, 3, 0]} maxBarSize={14} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-xs text-zinc-500 text-center py-6">No mistakes tagged yet</p>
          )}
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5">
          <h2 className="text-sm font-semibold text-zinc-200 mb-4">By Instrument</h2>
          <InstrumentBreakdown data={analytics.byInstrument} />
        </div>
      </div>

      {/* Session Heatmap */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5">
        <h2 className="text-sm font-semibold text-zinc-200 mb-1">Session Performance</h2>
        <p className="text-xs text-zinc-500 mb-4">P&L breakdown by trading session</p>
        <SessionHeatmap bySession={analytics.bySession} byDayOfWeek={analytics.byDayOfWeek} />
      </div>

      {/* Day of week */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5">
        <h2 className="text-sm font-semibold text-zinc-200 mb-4">Performance by Day of Week</h2>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={dowData} margin={{ top: 5, right: 5, left: 5, bottom: 0 }}>
            <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#a1a1aa" }} tickLine={false} axisLine={false} />
            <YAxis hide />
            <Tooltip contentStyle={{ background: "#18181b", border: "1px solid #27272a", borderRadius: 8, fontSize: 11 }} formatter={(v: any) => formatCurrency(v)} />
            <ReferenceLine y={0} stroke="#3f3f46" />
            <Bar dataKey="netPnl" radius={[3, 3, 0, 0]} maxBarSize={40}>
              {dowData.map((entry, i) => (
                <Cell key={i} fill={(entry.netPnl ?? 0) >= 0 ? "#10b981" : "#ef4444"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
