"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

interface WinRateDonutProps {
  wins: number;
  losses: number;
  breakevens: number;
}

const COLORS = {
  win: "#10b981",
  loss: "#ef4444",
  breakeven: "#6366f1",
};

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const { name, value } = payload[0];
  return (
    <div className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs shadow-xl">
      <p className="text-zinc-300">
        {name}: <span className="font-semibold">{value}</span>
      </p>
    </div>
  );
}

export function WinRateDonut({ wins, losses, breakevens }: WinRateDonutProps) {
  const total = wins + losses + breakevens;
  const winRate = total > 0 ? Math.round((wins / total) * 100) : 0;

  const data = [
    { name: "Wins", value: wins },
    { name: "Losses", value: losses },
    { name: "Breakeven", value: breakevens },
  ].filter((d) => d.value > 0);

  if (total === 0) {
    return (
      <div className="flex h-[140px] items-center justify-center">
        <p className="text-xs text-zinc-500">No closed trades</p>
      </div>
    );
  }

  return (
    <div className="relative flex items-center justify-center">
      <ResponsiveContainer width={140} height={140}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={45}
            outerRadius={65}
            paddingAngle={2}
            dataKey="value"
            startAngle={90}
            endAngle={-270}
          >
            {data.map((entry, index) => (
              <Cell
                key={index}
                fill={
                  entry.name === "Wins"
                    ? COLORS.win
                    : entry.name === "Losses"
                    ? COLORS.loss
                    : COLORS.breakeven
                }
                stroke="transparent"
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} cursor={false} />
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <p className="text-2xl font-bold text-zinc-50">{winRate}%</p>
        <p className="text-[10px] text-zinc-500">Win Rate</p>
      </div>
    </div>
  );
}
