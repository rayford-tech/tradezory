"use client";

import { formatCurrency } from "@/lib/utils";

const SESSIONS = [
  { key: "ASIAN", label: "Asian" },
  { key: "LONDON", label: "London" },
  { key: "NEW_YORK", label: "New York" },
  { key: "LONDON_NY_OVERLAP", label: "Ldn/NY" },
];

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

interface SessionData {
  session: string;
  trades: number;
  wins: number;
  losses: number;
  netPnl: number;
  winRate: number;
}

interface DayData {
  day: string;
  trades: number;
  wins: number;
  losses: number;
  netPnl: number;
  winRate: number;
}

interface SessionHeatmapProps {
  bySession: Record<string, SessionData>;
  byDayOfWeek: Record<string, DayData>;
}

function pnlColor(pnl: number, trades: number): string {
  if (trades === 0) return "bg-zinc-800/50 text-zinc-600";
  if (pnl > 200) return "bg-emerald-500/30 text-emerald-300";
  if (pnl > 0) return "bg-emerald-500/15 text-emerald-400";
  if (pnl < -200) return "bg-red-500/30 text-red-300";
  if (pnl < 0) return "bg-red-500/15 text-red-400";
  return "bg-zinc-700/40 text-zinc-400";
}

export function SessionHeatmap({ bySession, byDayOfWeek }: SessionHeatmapProps) {
  return (
    <div className="space-y-5">
      {/* Session summary row */}
      <div className="grid grid-cols-4 gap-3">
        {SESSIONS.map(({ key, label }) => {
          const s = bySession[key] ?? { trades: 0, netPnl: 0, winRate: 0 };
          return (
            <div key={key} className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-3">
              <p className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider mb-1">{label}</p>
              <p className={`text-sm font-semibold ${s.netPnl > 0 ? "text-emerald-400" : s.netPnl < 0 ? "text-red-400" : "text-zinc-400"}`}>
                {s.trades > 0 ? formatCurrency(s.netPnl) : "—"}
              </p>
              <p className="text-[10px] text-zinc-600 mt-0.5">
                {s.trades > 0 ? `${s.trades}t · ${Math.round(s.winRate * 100)}% WR` : "No trades"}
              </p>
            </div>
          );
        })}
      </div>

      {/* Day × Session heatmap grid */}
      <div>
        <p className="text-xs font-medium text-zinc-500 mb-3">Net P&L by Session × Day</p>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr>
                <th className="text-left text-zinc-600 font-normal pb-2 pr-3 w-16"></th>
                {SESSIONS.map(({ label }) => (
                  <th key={label} className="text-center text-zinc-500 font-medium pb-2 px-1">{label}</th>
                ))}
                <th className="text-center text-zinc-500 font-medium pb-2 px-1">Total</th>
              </tr>
            </thead>
            <tbody>
              {DAYS.map((day) => {
                const dayData = byDayOfWeek[day] ?? { trades: 0, netPnl: 0 };
                return (
                  <tr key={day}>
                    <td className="text-zinc-500 pr-3 py-1 text-right">{day.slice(0, 3)}</td>
                    {SESSIONS.map(({ key }) => {
                      // We only have bySession totals, not cross-tab — show session col summary in first row
                      // For the grid cells: show day totals in rightmost col, session totals in bottom row
                      return (
                        <td key={key} className="px-1 py-1">
                          <div className="rounded px-2 py-1.5 text-center text-[10px] bg-zinc-800/40 text-zinc-600">—</div>
                        </td>
                      );
                    })}
                    <td className="px-1 py-1">
                      <div className={`rounded px-2 py-1.5 text-center text-[10px] font-medium ${pnlColor(dayData.netPnl, dayData.trades)}`}>
                        {dayData.trades > 0 ? formatCurrency(dayData.netPnl) : "—"}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {/* Session totals row */}
              <tr className="border-t border-zinc-800">
                <td className="text-zinc-500 pr-3 py-1.5 text-right">Total</td>
                {SESSIONS.map(({ key }) => {
                  const s = bySession[key] ?? { trades: 0, netPnl: 0 };
                  return (
                    <td key={key} className="px-1 py-1.5">
                      <div className={`rounded px-2 py-1.5 text-center text-[10px] font-medium ${pnlColor(s.netPnl, s.trades)}`}>
                        {s.trades > 0 ? formatCurrency(s.netPnl) : "—"}
                      </div>
                    </td>
                  );
                })}
                <td className="px-1 py-1.5">
                  <div className={`rounded px-2 py-1.5 text-center text-[10px] font-bold ${pnlColor(
                    Object.values(bySession).reduce((s, d) => s + d.netPnl, 0),
                    Object.values(bySession).reduce((s, d) => s + d.trades, 0)
                  )}`}>
                    {formatCurrency(Object.values(bySession).reduce((s, d) => s + d.netPnl, 0))}
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
