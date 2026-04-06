"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
} from "recharts";
import { formatCurrency } from "@/lib/utils";

interface DailyPnlBarProps {
  data: { date: string; pnl: number; trades: number }[];
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const pnl = payload[0]?.value ?? 0;
  const trades = payload[0]?.payload?.trades ?? 0;
  return (
    <div className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs shadow-xl">
      <p className="text-zinc-400 mb-1">{label}</p>
      <p className={pnl >= 0 ? "text-emerald-400 font-semibold" : "text-red-400 font-semibold"}>
        {formatCurrency(pnl)}
      </p>
      <p className="text-zinc-500">{trades} trade{trades !== 1 ? "s" : ""}</p>
    </div>
  );
}

export function DailyPnlBar({ data }: DailyPnlBarProps) {
  const recent = data.slice(-30);

  return (
    <ResponsiveContainer width="100%" height={120}>
      <BarChart data={recent} margin={{ top: 5, right: 5, left: 5, bottom: 0 }} barSize={6}>
        <XAxis dataKey="date" hide />
        <YAxis hide />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
        <ReferenceLine y={0} stroke="#3f3f46" />
        <Bar dataKey="pnl" radius={[2, 2, 0, 0]}>
          {recent.map((entry, index) => (
            <Cell key={index} fill={entry.pnl >= 0 ? "#10b981" : "#ef4444"} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
