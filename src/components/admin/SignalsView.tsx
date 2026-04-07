"use client";

import { useState } from "react";
import { Loader2, X } from "lucide-react";

type Signal = {
  id: string;
  instrument: string;
  direction: string;
  volume: number;
  openPrice: number;
  stopLoss: number | null;
  takeProfit: number | null;
  status: string;
  createdAt: string;
  executedAt: string | null;
  trader: string;
};

type Filter = "ALL" | "PENDING" | "EXECUTED";

export function SignalsView({ signals: initial }: { signals: Signal[] }) {
  const [signals, setSignals] = useState(initial);
  const [filter, setFilter] = useState<Filter>("PENDING");
  const [loading, setLoading] = useState<string | null>(null);

  async function cancelSignal(id: string) {
    setLoading(id);
    try {
      await fetch("/api/copy-signals", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signalId: id }),
      });
      setSignals((prev) =>
        prev.map((s) => (s.id === id ? { ...s, status: "CANCELLED" } : s))
      );
    } catch {
      alert("Failed to cancel signal");
    } finally {
      setLoading(null);
    }
  }

  const filtered = filter === "ALL" ? signals : signals.filter((s) => s.status === filter);

  const statusColor = (status: string) =>
    status === "PENDING"
      ? "text-amber-400 bg-amber-400/10"
      : status === "EXECUTED"
      ? "text-emerald-400 bg-emerald-400/10"
      : "text-zinc-500 bg-zinc-800";

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {(["PENDING", "EXECUTED", "ALL"] as Filter[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filter === f
                ? "bg-indigo-600 text-white"
                : "border border-zinc-700 text-zinc-400 hover:bg-zinc-800"
            }`}
          >
            {f}
          </button>
        ))}
        <span className="ml-auto text-xs text-zinc-500 self-center">
          {filtered.length} signal{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      <div className="rounded-xl border border-zinc-800 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-800 bg-zinc-900/80">
              <th className="text-left px-4 py-3 text-xs font-medium text-zinc-400">Trader</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-zinc-400">Instrument</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-zinc-400">Dir</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-zinc-400">Volume</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-zinc-400">Entry</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-zinc-400">SL / TP</th>
              <th className="text-center px-4 py-3 text-xs font-medium text-zinc-400">Status</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-zinc-400">Time</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((s) => (
              <tr key={s.id} className="border-b border-zinc-800/50 hover:bg-zinc-900/40 transition-colors">
                <td className="px-4 py-3 text-zinc-300 text-xs">{s.trader}</td>
                <td className="px-4 py-3 font-medium text-zinc-100">{s.instrument}</td>
                <td className="px-4 py-3">
                  <span className={s.direction === "BUY" ? "text-emerald-400" : "text-red-400"}>
                    {s.direction}
                  </span>
                </td>
                <td className="px-4 py-3 text-right text-zinc-300">{s.volume}</td>
                <td className="px-4 py-3 text-right text-zinc-300">{s.openPrice}</td>
                <td className="px-4 py-3 text-right text-xs text-zinc-500">
                  {s.stopLoss ?? "—"} / {s.takeProfit ?? "—"}
                </td>
                <td className="px-4 py-3 text-center">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${statusColor(s.status)}`}>
                    {s.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-right text-xs text-zinc-500">
                  {new Date(s.createdAt).toLocaleString()}
                </td>
                <td className="px-4 py-3 text-right">
                  {s.status === "PENDING" && (
                    <button
                      onClick={() => cancelSignal(s.id)}
                      disabled={loading === s.id}
                      className="rounded p-1 text-zinc-500 hover:text-red-400 hover:bg-red-400/10 transition-colors disabled:opacity-50"
                    >
                      {loading === s.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <X className="h-3.5 w-3.5" />
                      )}
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-sm text-zinc-500">
                  No signals
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/30 p-4 text-xs text-zinc-500 space-y-1">
        <p className="font-medium text-zinc-400">EA Integration</p>
        <p>Configure your EA to poll: <code className="text-indigo-400">GET /api/copy-signals</code></p>
        <p>Mark executed: <code className="text-indigo-400">GET /api/copy-signals?signalId=&lt;id&gt;&ticket=&lt;mt5ticket&gt;</code></p>
        <p>Include your session cookie or use a bearer token from your login session.</p>
      </div>
    </div>
  );
}
