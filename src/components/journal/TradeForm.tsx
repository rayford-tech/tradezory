"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { TradingAccount, SetupTag, MistakeTag } from "@/types";
import { Loader2, Plus, X } from "lucide-react";

interface TradeFormProps {
  accounts: TradingAccount[];
  setupTags: SetupTag[];
  mistakeTags: MistakeTag[];
  defaultValues?: Record<string, any>;
  tradeId?: string;
}

const ASSET_CLASSES = ["FOREX", "CRYPTO", "STOCKS", "INDICES", "COMMODITIES", "OTHER"];
const SESSIONS = [
  { value: "ASIAN", label: "Asian (00:00–08:00 UTC)" },
  { value: "LONDON", label: "London (08:00–13:00 UTC)" },
  { value: "NEW_YORK", label: "New York (13:00–22:00 UTC)" },
  { value: "LONDON_NY_OVERLAP", label: "London/NY Overlap (13:00–16:00 UTC)" },
];
const EMOTIONS = ["CONFIDENT", "ANXIOUS", "CALM", "FEARFUL", "GREEDY", "NEUTRAL", "FRUSTRATED", "EXCITED"];

export function TradeForm({ accounts, setupTags, mistakeTags, defaultValues, tradeId }: TradeFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedSetupTags, setSelectedSetupTags] = useState<string[]>(defaultValues?.setupTagIds ?? []);
  const [selectedMistakeTags, setSelectedMistakeTags] = useState<string[]>(defaultValues?.mistakeTagIds ?? []);

  const defaultAccount = accounts.find((a) => a.isDefault)?.id ?? accounts[0]?.id ?? "";

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const form = e.currentTarget;
    const fd = new FormData(form);

    const parseNum = (key: string) => {
      const v = fd.get(key) as string;
      return v ? parseFloat(v) : null;
    };

    const body = {
      accountId: fd.get("accountId"),
      instrument: (fd.get("instrument") as string)?.toUpperCase(),
      assetClass: fd.get("assetClass"),
      direction: fd.get("direction"),
      entryPrice: parseFloat(fd.get("entryPrice") as string),
      exitPrice: parseNum("exitPrice"),
      stopLoss: parseNum("stopLoss"),
      takeProfit: parseNum("takeProfit"),
      lotSize: parseNum("lotSize"),
      positionSize: parseNum("positionSize"),
      riskAmount: parseNum("riskAmount"),
      rewardAmount: parseNum("rewardAmount"),
      rrRatio: parseNum("rrRatio"),
      grossPnl: parseNum("grossPnl"),
      netPnl: parseNum("netPnl"),
      commission: parseNum("commission"),
      swap: parseNum("swap"),
      openTime: fd.get("openTime"),
      closeTime: fd.get("closeTime") || null,
      session: fd.get("session") || null,
      tradeType: fd.get("tradeType"),
      status: fd.get("status"),
      emotionBefore: fd.get("emotionBefore") || null,
      emotionAfter: fd.get("emotionAfter") || null,
      executionScore: parseNum("executionScore"),
      disciplineScore: parseNum("disciplineScore"),
      confidenceScore: parseNum("confidenceScore"),
      preTradeReasoning: fd.get("preTradeReasoning") || null,
      postTradeReview: fd.get("postTradeReview") || null,
      notes: fd.get("notes") || null,
      setupTagIds: selectedSetupTags,
      mistakeTagIds: selectedMistakeTags,
    };

    const url = tradeId ? `/api/trades/${tradeId}` : "/api/trades";
    const method = tradeId ? "PATCH" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error?.message ?? JSON.stringify(data.error) ?? "Failed to save trade");
      setLoading(false);
      return;
    }

    const trade = await res.json();
    router.push(`/journal/${trade.id}`);
    router.refresh();
  }

  function toggleTag(id: string, type: "setup" | "mistake") {
    if (type === "setup") {
      setSelectedSetupTags((prev) =>
        prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
      );
    } else {
      setSelectedMistakeTags((prev) =>
        prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
      );
    }
  }

  const now = new Date().toISOString().slice(0, 16);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Core Details */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5 space-y-4">
        <h2 className="text-sm font-semibold text-zinc-200">Trade Details</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Account</label>
            <select name="accountId" defaultValue={defaultValues?.accountId ?? defaultAccount} required className="input">
              {accounts.map((a) => <option key={a.id} value={a.id}>{a.name} ({a.type})</option>)}
            </select>
          </div>
          <div>
            <label className="label">Trade Type</label>
            <select name="tradeType" defaultValue={defaultValues?.tradeType ?? "LIVE"} className="input">
              <option value="LIVE">Live</option>
              <option value="DEMO">Demo</option>
              <option value="BACKTEST">Backtest</option>
            </select>
          </div>
          <div>
            <label className="label">Instrument *</label>
            <input name="instrument" defaultValue={defaultValues?.instrument ?? ""} placeholder="EURUSD" required className="input" />
          </div>
          <div>
            <label className="label">Asset Class</label>
            <select name="assetClass" defaultValue={defaultValues?.assetClass ?? "FOREX"} className="input">
              {ASSET_CLASSES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Direction *</label>
            <select name="direction" defaultValue={defaultValues?.direction ?? "BUY"} required className="input">
              <option value="BUY">Buy (Long)</option>
              <option value="SELL">Sell (Short)</option>
            </select>
          </div>
          <div>
            <label className="label">Status</label>
            <select name="status" defaultValue={defaultValues?.status ?? "OPEN"} className="input">
              <option value="OPEN">Open</option>
              <option value="CLOSED">Closed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      {/* Prices */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5 space-y-4">
        <h2 className="text-sm font-semibold text-zinc-200">Prices & Risk</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { name: "entryPrice", label: "Entry Price *", required: true },
            { name: "exitPrice", label: "Exit Price" },
            { name: "stopLoss", label: "Stop Loss" },
            { name: "takeProfit", label: "Take Profit" },
          ].map(({ name, label, required }) => (
            <div key={name}>
              <label className="label">{label}</label>
              <input name={name} type="number" step="any" defaultValue={defaultValues?.[name] ?? ""} required={required} placeholder="0.00000" className="input" />
            </div>
          ))}
          {[
            { name: "lotSize", label: "Lot Size" },
            { name: "positionSize", label: "Position Size ($)" },
            { name: "riskAmount", label: "Risk ($)" },
            { name: "rewardAmount", label: "Reward ($)" },
            { name: "rrRatio", label: "RR Ratio" },
            { name: "grossPnl", label: "Gross P&L" },
            { name: "netPnl", label: "Net P&L" },
            { name: "commission", label: "Commission" },
          ].map(({ name, label }) => (
            <div key={name}>
              <label className="label">{label}</label>
              <input name={name} type="number" step="any" defaultValue={defaultValues?.[name] ?? ""} placeholder="0.00" className="input" />
            </div>
          ))}
        </div>
      </div>

      {/* Timing */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5 space-y-4">
        <h2 className="text-sm font-semibold text-zinc-200">Timing & Session</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div>
            <label className="label">Open Time *</label>
            <input name="openTime" type="datetime-local" defaultValue={defaultValues?.openTime?.slice(0, 16) ?? now} required className="input" />
          </div>
          <div>
            <label className="label">Close Time</label>
            <input name="closeTime" type="datetime-local" defaultValue={defaultValues?.closeTime?.slice(0, 16) ?? ""} className="input" />
          </div>
          <div>
            <label className="label">Session (auto-detected)</label>
            <select name="session" defaultValue={defaultValues?.session ?? ""} className="input">
              <option value="">Auto-detect</option>
              {SESSIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Tags */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5 space-y-4">
        <h2 className="text-sm font-semibold text-zinc-200">Tags</h2>
        <div>
          <label className="label mb-2">Setup Tags</label>
          <div className="flex flex-wrap gap-2">
            {setupTags.map((tag) => (
              <button
                key={tag.id}
                type="button"
                onClick={() => toggleTag(tag.id, "setup")}
                className="rounded-full px-3 py-1 text-xs font-medium border transition-all"
                style={{
                  borderColor: selectedSetupTags.includes(tag.id) ? tag.color : "#3f3f46",
                  backgroundColor: selectedSetupTags.includes(tag.id) ? tag.color + "22" : "transparent",
                  color: selectedSetupTags.includes(tag.id) ? tag.color : "#a1a1aa",
                }}
              >
                {tag.name}
              </button>
            ))}
            {setupTags.length === 0 && <p className="text-xs text-zinc-500">No setup tags yet. Create them in Settings.</p>}
          </div>
        </div>
        <div>
          <label className="label mb-2">Mistake Tags</label>
          <div className="flex flex-wrap gap-2">
            {mistakeTags.map((tag) => (
              <button
                key={tag.id}
                type="button"
                onClick={() => toggleTag(tag.id, "mistake")}
                className="rounded-full px-3 py-1 text-xs font-medium border transition-all"
                style={{
                  borderColor: selectedMistakeTags.includes(tag.id) ? tag.color : "#3f3f46",
                  backgroundColor: selectedMistakeTags.includes(tag.id) ? tag.color + "22" : "transparent",
                  color: selectedMistakeTags.includes(tag.id) ? tag.color : "#a1a1aa",
                }}
              >
                ⚠ {tag.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Psychology */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5 space-y-4">
        <h2 className="text-sm font-semibold text-zinc-200">Psychology & Scores</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div>
            <label className="label">Emotion Before</label>
            <select name="emotionBefore" defaultValue={defaultValues?.emotionBefore ?? ""} className="input">
              <option value="">Select...</option>
              {EMOTIONS.map((e) => <option key={e} value={e}>{e.charAt(0) + e.slice(1).toLowerCase()}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Emotion After</label>
            <select name="emotionAfter" defaultValue={defaultValues?.emotionAfter ?? ""} className="input">
              <option value="">Select...</option>
              {EMOTIONS.map((e) => <option key={e} value={e}>{e.charAt(0) + e.slice(1).toLowerCase()}</option>)}
            </select>
          </div>
          {[
            { name: "executionScore", label: "Execution Score (1–10)" },
            { name: "disciplineScore", label: "Discipline Score (1–10)" },
            { name: "confidenceScore", label: "Confidence Score (1–10)" },
          ].map(({ name, label }) => (
            <div key={name}>
              <label className="label">{label}</label>
              <input name={name} type="number" min={1} max={10} step={1} defaultValue={defaultValues?.[name] ?? ""} placeholder="7" className="input" />
            </div>
          ))}
        </div>
      </div>

      {/* Notes */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5 space-y-4">
        <h2 className="text-sm font-semibold text-zinc-200">Notes & Review</h2>
        <div>
          <label className="label">Pre-Trade Reasoning</label>
          <textarea name="preTradeReasoning" defaultValue={defaultValues?.preTradeReasoning ?? ""} rows={3} placeholder="Why did you take this trade? What was the setup?" className="input resize-none" />
        </div>
        <div>
          <label className="label">Post-Trade Review</label>
          <textarea name="postTradeReview" defaultValue={defaultValues?.postTradeReview ?? ""} rows={3} placeholder="What happened? What did you learn?" className="input resize-none" />
        </div>
        <div>
          <label className="label">Additional Notes</label>
          <textarea name="notes" defaultValue={defaultValues?.notes ?? ""} rows={2} placeholder="Any other notes..." className="input resize-none" />
        </div>
      </div>

      <div className="flex gap-3 justify-end">
        <button type="button" onClick={() => router.back()} className="rounded-lg border border-zinc-700 px-5 py-2.5 text-sm font-medium text-zinc-300 hover:bg-zinc-800 transition-colors">
          Cancel
        </button>
        <button type="submit" disabled={loading} className="flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-60 transition-colors">
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {tradeId ? "Save Changes" : "Log Trade"}
        </button>
      </div>

      <style jsx>{`
        .label {
          @apply block text-xs font-medium text-zinc-400 mb-1.5;
        }
        .input {
          @apply w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/20 transition-colors;
        }
      `}</style>
    </form>
  );
}
