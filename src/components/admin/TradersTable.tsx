"use client";

import { useState } from "react";
import { UserCheck, UserPlus, Loader2 } from "lucide-react";

interface Trader {
  id: string;
  name: string;
  email: string;
  plan: string;
  joinedAt: string;
  closedTrades: number;
  winRate: number;
  netPnl: number;
  isFollowed: boolean;
}

export function TradersTable({ traders: initial }: { traders: Trader[] }) {
  const [traders, setTraders] = useState(initial);
  const [loading, setLoading] = useState<string | null>(null);

  async function toggleFollow(userId: string) {
    setLoading(userId);
    try {
      const res = await fetch("/api/admin/follow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      const data = await res.json();
      setTraders((prev) =>
        prev.map((t) => (t.id === userId ? { ...t, isFollowed: data.following } : t))
      );
    } catch {
      alert("Failed to update follow");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="rounded-xl border border-zinc-800 overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-zinc-800 bg-zinc-900/80">
            <th className="text-left px-4 py-3 text-xs font-medium text-zinc-400">Trader</th>
            <th className="text-left px-4 py-3 text-xs font-medium text-zinc-400">Plan</th>
            <th className="text-right px-4 py-3 text-xs font-medium text-zinc-400">Trades</th>
            <th className="text-right px-4 py-3 text-xs font-medium text-zinc-400">Win Rate</th>
            <th className="text-right px-4 py-3 text-xs font-medium text-zinc-400">Net P&L</th>
            <th className="text-right px-4 py-3 text-xs font-medium text-zinc-400">Joined</th>
            <th className="px-4 py-3"></th>
          </tr>
        </thead>
        <tbody>
          {traders.map((t) => (
            <tr
              key={t.id}
              className={`border-b border-zinc-800/50 hover:bg-zinc-900/40 transition-colors ${
                t.isFollowed ? "bg-indigo-500/5" : ""
              }`}
            >
              <td className="px-4 py-3">
                <p className="font-medium text-zinc-100">{t.name}</p>
                <p className="text-xs text-zinc-500">{t.email}</p>
              </td>
              <td className="px-4 py-3">
                <span className="text-xs text-zinc-400">{t.plan}</span>
              </td>
              <td className="px-4 py-3 text-right text-zinc-300">{t.closedTrades}</td>
              <td className="px-4 py-3 text-right">
                <span
                  className={`font-medium ${
                    t.winRate >= 0.6
                      ? "text-emerald-400"
                      : t.winRate >= 0.4
                      ? "text-amber-400"
                      : "text-red-400"
                  }`}
                >
                  {t.closedTrades > 0 ? `${(t.winRate * 100).toFixed(0)}%` : "—"}
                </span>
              </td>
              <td className="px-4 py-3 text-right">
                <span className={t.netPnl >= 0 ? "text-emerald-400" : "text-red-400"}>
                  {t.closedTrades > 0 ? `$${t.netPnl.toFixed(0)}` : "—"}
                </span>
              </td>
              <td className="px-4 py-3 text-right text-xs text-zinc-500">
                {new Date(t.joinedAt).toLocaleDateString()}
              </td>
              <td className="px-4 py-3 text-right">
                <button
                  onClick={() => toggleFollow(t.id)}
                  disabled={loading === t.id}
                  className={`flex items-center gap-1.5 ml-auto rounded-lg px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50 ${
                    t.isFollowed
                      ? "bg-indigo-600/20 text-indigo-400 hover:bg-red-500/10 hover:text-red-400"
                      : "border border-zinc-700 text-zinc-400 hover:bg-zinc-800"
                  }`}
                >
                  {loading === t.id ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : t.isFollowed ? (
                    <UserCheck className="h-3 w-3" />
                  ) : (
                    <UserPlus className="h-3 w-3" />
                  )}
                  {t.isFollowed ? "Following" : "Follow"}
                </button>
              </td>
            </tr>
          ))}
          {traders.length === 0 && (
            <tr>
              <td colSpan={7} className="px-4 py-8 text-center text-sm text-zinc-500">
                No traders yet
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
