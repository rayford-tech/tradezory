"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { formatCurrency } from "@/lib/utils";
import type { InstrumentStats } from "@/types";

interface InstrumentBreakdownProps {
  data: Record<string, InstrumentStats>;
}

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const { instrument, netPnl, winRate, trades } = payload[0]?.payload ?? {};
  return (
    <div className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs shadow-xl space-y-1">
      <p className="font-semibold text-zinc-200">{instrument}</p>
      <p className={netPnl >= 0 ? "text-emerald-400" : "text-red-400"}>{formatCurrency(netPnl)}</p>
      <p className="text-zinc-500">{trades} trades · {Math.round(winRate * 100)}% WR</p>
    </div>
  );
}

export function InstrumentBreakdown({ data }: InstrumentBreakdownProps) {
  const items = Object.values(data)
    .sort((a, b) => Math.abs(b.netPnl) - Math.abs(a.netPnl))
    .slice(0, 8)
    .map((d) => ({ ...d, instrument: d.instrument }));

  if (items.length === 0) {
    return <p className="text-xs text-zinc-500 text-center py-6">No data</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={items} layout="vertical" margin={{ top: 0, right: 10, left: 60, bottom: 0 }}>
        <XAxis type="number" hide />
        <YAxis
          type="category"
          dataKey="instrument"
          tick={{ fontSize: 11, fill: "#a1a1aa" }}
          tickLine={false}
          axisLine={false}
          width={55}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
        <Bar dataKey="netPnl" radius={[0, 3, 3, 0]} maxBarSize={16}>
          {items.map((entry, i) => (
            <Cell key={i} fill={entry.netPnl >= 0 ? "#10b981" : "#ef4444"} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
