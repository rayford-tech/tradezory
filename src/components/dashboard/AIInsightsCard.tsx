"use client";

import { useEffect, useState } from "react";
import { Sparkles, RefreshCw } from "lucide-react";

export function AIInsightsCard() {
  const [insights, setInsights] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  async function load() {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch("/api/ai/insights", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? `Error ${res.status}`);
      setInsights(data.insights ?? []);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  return (
    <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-indigo-400" />
          <h2 className="text-sm font-semibold text-zinc-200">AI Insights</h2>
          <span className="rounded-full bg-indigo-600/20 px-2 py-0.5 text-[10px] font-medium text-indigo-400 border border-indigo-500/20">
            Gemini AI
          </span>
        </div>
        {!loading && (
          <button
            onClick={load}
            className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            <RefreshCw className="h-3 w-3" /> Refresh
          </button>
        )}
      </div>

      {loading ? (
        <div className="space-y-2.5">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-start gap-2">
              <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-500/30 animate-pulse" />
              <div
                className="h-4 rounded bg-zinc-800 animate-pulse"
                style={{ width: `${65 + i * 7}%` }}
              />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="py-2 space-y-1.5">
          <p className="text-xs text-zinc-500">
            AI insights unavailable — ensure <code className="text-zinc-400">GEMINI_API_KEY</code> is set in <code className="text-zinc-400">.env</code>.{" "}
            Get a free key at{" "}
            <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300 underline">
              aistudio.google.com
            </a>
          </p>
          <button onClick={load} className="text-xs text-indigo-400 hover:text-indigo-300">
            Retry
          </button>
        </div>
      ) : insights.length === 0 ? (
        <p className="text-xs text-zinc-500 py-2">No data yet — close some trades to get insights.</p>
      ) : (
        <ul className="space-y-2">
          {insights.map((insight, i) => (
            <li key={i} className="flex items-start gap-2">
              <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-500" />
              <p className="text-sm text-zinc-300 leading-relaxed">{insight}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
