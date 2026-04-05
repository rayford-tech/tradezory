"use client";

import { formatCurrency, formatRR } from "@/lib/utils";
import type { AnalyticsResult, TradingAccount, SetupTag, MistakeTag } from "@/types";
import { PnlChart } from "@/components/dashboard/PnlChart";
import { WinRateDonut } from "@/components/dashboard/WinRateDonut";
import { InstrumentBreakdown } from "@/components/dashboard/InstrumentBreakdown";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LineChart, Line, ReferenceLine
} from "recharts";

interface AnalyticsViewProps {
  analytics: AnalyticsResult;
  accounts: TradingAccount[];
  setupTags: SetupTag[];
  mistakeTags: MistakeTag[];
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

export function AnalyticsView({ analytics, accounts, setupTags, mistakeTags }: AnalyticsViewProps) {
  const setupData = Object.values(analytics.bySetupTag).sort((a, b) => b.netPnl - a.netPnl);
  const mistakeData = analytics.mistakeFrequency.slice(0, 8);
  const dowData = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"].map((day) => ({
    ...analytics.byDayOfWeek[day],
    day: day.slice(0, 3),
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-zinc-50">Analytics</h1>
        <p className="text-sm text-zinc-400">{analytics.totalTrades} closed trades analyzed</p>
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
