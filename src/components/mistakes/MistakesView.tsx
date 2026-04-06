"use client";

import type { AnalyticsResult, MistakeTag } from "@/types";
import { formatCurrency } from "@/lib/utils";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { AlertTriangle, Plus } from "lucide-react";
import { useState } from "react";

interface MistakesViewProps {
  analytics: AnalyticsResult;
  mistakeTags: MistakeTag[];
}

export function MistakesView({ analytics, mistakeTags }: MistakesViewProps) {
  const [newTag, setNewTag] = useState("");
  const [creatingTag, setCreatingTag] = useState(false);

  async function createMistakeTag() {
    if (!newTag.trim()) return;
    await fetch("/api/mistake-tags", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newTag.trim() }),
    });
    window.location.reload();
  }

  const mistakeData = analytics.mistakeFrequency.slice(0, 10);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-zinc-50">Mistake Tracker</h1>
          <p className="text-sm text-zinc-400">Identify and eliminate trading mistakes</p>
        </div>
        <button onClick={() => setCreatingTag(true)} className="flex items-center gap-2 rounded-lg border border-zinc-700 px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-800 transition-colors">
          <Plus className="h-4 w-4" /> Add Mistake Tag
        </button>
      </div>

      {creatingTag && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 flex gap-3">
          <input
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && createMistakeTag()}
            placeholder="e.g. FOMO, Early Entry, Overtrading..."
            className="flex-1 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-indigo-500 focus:outline-none"
            autoFocus
          />
          <button onClick={createMistakeTag} className="rounded-lg bg-indigo-600 px-3 py-2 text-sm text-white hover:bg-indigo-500">Create</button>
          <button onClick={() => setCreatingTag(false)} className="rounded-lg border border-zinc-700 px-3 py-2 text-sm text-zinc-400 hover:bg-zinc-800">Cancel</button>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {mistakeData.slice(0, 4).map((m) => (
          <div key={m.name} className="rounded-xl border border-red-500/20 bg-red-500/5 p-4">
            <div className="flex items-start gap-2 mb-2">
              <AlertTriangle className="h-3.5 w-3.5 text-red-400 mt-0.5 shrink-0" />
              <p className="text-xs font-medium text-zinc-300">{m.name}</p>
            </div>
            <p className="text-xl font-bold text-red-400">{m.count}×</p>
            <p className="text-xs text-zinc-500 mt-0.5">P&L impact: <span className={m.pnlImpact >= 0 ? "text-emerald-400" : "text-red-400"}>{formatCurrency(m.pnlImpact)}</span></p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Frequency chart */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5">
          <h2 className="text-sm font-semibold text-zinc-200 mb-4">Mistake Frequency</h2>
          {mistakeData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={mistakeData} layout="vertical" margin={{ top: 0, right: 10, left: 90, bottom: 0 }}>
                <XAxis type="number" tick={{ fontSize: 10, fill: "#71717a" }} tickLine={false} axisLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "#a1a1aa" }} tickLine={false} axisLine={false} width={85} />
                <Tooltip contentStyle={{ background: "#18181b", border: "1px solid #27272a", borderRadius: 8, fontSize: 11 }} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
                <Bar dataKey="count" fill="#ef4444" radius={[0, 3, 3, 0]} maxBarSize={16} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-xs text-zinc-500 text-center py-10">Tag your trades with mistake tags to track patterns</p>
          )}
        </div>

        {/* P&L impact chart */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5">
          <h2 className="text-sm font-semibold text-zinc-200 mb-4">P&L Impact by Mistake</h2>
          {mistakeData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={mistakeData} layout="vertical" margin={{ top: 0, right: 10, left: 90, bottom: 0 }}>
                <XAxis type="number" tick={{ fontSize: 10, fill: "#71717a" }} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "#a1a1aa" }} tickLine={false} axisLine={false} width={85} />
                <Tooltip contentStyle={{ background: "#18181b", border: "1px solid #27272a", borderRadius: 8, fontSize: 11 }} cursor={{ fill: "rgba(255,255,255,0.04)" }} formatter={(v: any) => formatCurrency(v)} />
                <Bar dataKey="pnlImpact" radius={[0, 3, 3, 0]} maxBarSize={16}>
                  {mistakeData.map((entry, i) => (
                    <Cell key={i} fill={entry.pnlImpact >= 0 ? "#10b981" : "#ef4444"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-xs text-zinc-500 text-center py-10">No data yet</p>
          )}
        </div>
      </div>

      {/* Mistake Tag Management */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5">
        <h2 className="text-sm font-semibold text-zinc-200 mb-4">All Mistake Tags ({mistakeTags.length})</h2>
        <div className="flex flex-wrap gap-2">
          {mistakeTags.map((tag) => {
            const stats = analytics.byMistakeTag[tag.name];
            return (
              <div key={tag.id} className="flex items-center gap-2 rounded-full border px-3 py-1.5" style={{ borderColor: tag.color + "44", backgroundColor: tag.color + "11" }}>
                <div className="h-2 w-2 rounded-full" style={{ backgroundColor: tag.color }} />
                <span className="text-xs font-medium" style={{ color: tag.color }}>{tag.name}</span>
                {stats && <span className="text-xs text-zinc-500">{stats.count}×</span>}
              </div>
            );
          })}
          {mistakeTags.length === 0 && <p className="text-xs text-zinc-500">No mistake tags created yet. Add some to start tracking.</p>}
        </div>
      </div>
    </div>
  );
}
