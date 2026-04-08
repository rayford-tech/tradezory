"use client";

import { useCallback, useEffect, useState } from "react";
import { Bot, RefreshCw } from "lucide-react";

interface TradeCoachCardProps {
  tradeId: string;
}

export function TradeCoachCard({ tradeId }: TradeCoachCardProps) {
  const [feedback, setFeedback] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    setFeedback("");
    fetch("/api/ai/coach", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tradeId }),
    })
      .then((r) =>
        r.ok
          ? r.json()
          : r.json().then((d) => Promise.reject(d.error ?? `Error ${r.status}`))
      )
      .then((d) => setFeedback(d.feedback ?? ""))
      .catch((msg) =>
        setError(typeof msg === "string" ? msg : "AI coach unavailable — try refreshing")
      )
      .finally(() => setLoading(false));
  }, [tradeId]);

  useEffect(() => {
    load();
  }, [load]);

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
          AI
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
        <div className="space-y-1.5">
          <p className="text-xs text-zinc-500">
            {error.includes("No AI API key") ? (
              <>
                AI coach unavailable — set <code className="text-zinc-400">GEMINI_API_KEY</code> in <code className="text-zinc-400">.env</code>.{" "}
                Get a free key at{" "}
                <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300 underline">
                  aistudio.google.com
                </a>
              </>
            ) : (
              error
            )}
          </p>
          <button
            onClick={load}
            className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            <RefreshCw className="h-3 w-3" /> Retry
          </button>
        </div>
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
