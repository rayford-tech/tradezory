"use client";

import { useEffect, useState } from "react";
import { Bot } from "lucide-react";

interface TradeCoachCardProps {
  tradeId: string;
}

export function TradeCoachCard({ tradeId }: TradeCoachCardProps) {
  const [feedback, setFeedback] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch("/api/ai/coach", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tradeId }),
    })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => setFeedback(d.feedback ?? ""))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [tradeId]);

  const observations = feedback
    .split(/\n+/)
    .map((l) => l.trim())
    .filter(Boolean);

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5">
      <div className="flex items-center gap-2 mb-4">
        <Bot className="h-4 w-4 text-indigo-400" />
        <h2 className="text-sm font-semibold text-zinc-200">AI Coach</h2>
        <span className="rounded-full bg-indigo-600/20 px-2 py-0.5 text-[10px] font-medium text-indigo-400 border border-indigo-500/20">
          Claude
        </span>
      </div>

      {loading ? (
        <div className="space-y-2.5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-1">
              <div className="h-3 w-8 rounded bg-zinc-800 animate-pulse" />
              <div className="h-4 rounded bg-zinc-800 animate-pulse" style={{ width: `${70 + i * 8}%` }} />
              <div className="h-4 rounded bg-zinc-800 animate-pulse" style={{ width: `${50 + i * 5}%` }} />
            </div>
          ))}
        </div>
      ) : error ? (
        <p className="text-xs text-zinc-500">AI coach unavailable — add ANTHROPIC_API_KEY to enable</p>
      ) : (
        <div className="space-y-3">
          {observations.map((obs, i) => (
            <p key={i} className="text-sm text-zinc-300 leading-relaxed">{obs}</p>
          ))}
        </div>
      )}
    </div>
  );
}
