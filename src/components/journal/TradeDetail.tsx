"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { formatCurrency, emotionEmoji, sessionLabel, pnlColor } from "@/lib/utils";
import type { TradeWithRelations, TradingAccount, SetupTag, MistakeTag } from "@/types";
import {
  ArrowLeft,
  ArrowUpRight,
  ArrowDownRight,
  Pencil,
  Trash2,
  Play,
  TrendingUp,
  TrendingDown,
  Clock,
  Target,
  Shield,
  Upload,
  X,
  Loader2,
} from "lucide-react";
import { TradeForm } from "./TradeForm";
import { TradeCoachCard } from "./TradeCoachCard";
import { useUploadThing } from "@/components/shared/UploadComponents";

interface TradeDetailProps {
  trade: TradeWithRelations & { replayData: any; account: TradingAccount };
  accounts: TradingAccount[];
  setupTags: SetupTag[];
  mistakeTags: MistakeTag[];
}

export function TradeDetail({ trade, accounts, setupTags, mistakeTags }: TradeDetailProps) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [screenshots, setScreenshots] = useState(trade.screenshots);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { startUpload, isUploading } = useUploadThing("screenshotUploader", {
    onClientUploadComplete: () => {
      router.refresh();
    },
  });

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    await startUpload(files, { tradeId: trade.id });
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function deleteScreenshot(screenshotId: string) {
    await fetch(`/api/screenshots/${screenshotId}`, { method: "DELETE" });
    setScreenshots((prev) => prev.filter((s) => s.id !== screenshotId));
  }

  const pnl = Number(trade.netPnl ?? 0);
  const isWin = pnl > 0;
  const isOpen = trade.status === "OPEN";

  const tradSetups = trade.tradeTags.filter((t) => t.setupTag).map((t) => t.setupTag!);
  const tradMistakes = trade.tradeTags.filter((t) => t.mistakeTag).map((t) => t.mistakeTag!);

  async function deleteTrade() {
    if (!confirm("Delete this trade? This cannot be undone.")) return;
    setDeleting(true);
    await fetch(`/api/trades/${trade.id}`, { method: "DELETE" });
    router.push("/journal");
    router.refresh();
  }

  if (editing) {
    return (
      <div className="max-w-3xl mx-auto space-y-5">
        <button onClick={() => setEditing(false)} className="flex items-center gap-1 text-sm text-zinc-400 hover:text-zinc-200">
          <ArrowLeft className="h-4 w-4" /> Back to detail
        </button>
        <TradeForm
          accounts={accounts}
          setupTags={setupTags}
          mistakeTags={mistakeTags}
          tradeId={trade.id}
          defaultValues={{
            ...trade,
            entryPrice: Number(trade.entryPrice),
            exitPrice: trade.exitPrice ? Number(trade.exitPrice) : undefined,
            stopLoss: trade.stopLoss ? Number(trade.stopLoss) : undefined,
            takeProfit: trade.takeProfit ? Number(trade.takeProfit) : undefined,
            netPnl: trade.netPnl ? Number(trade.netPnl) : undefined,
            grossPnl: trade.grossPnl ? Number(trade.grossPnl) : undefined,
            rrRatio: trade.rrRatio ? Number(trade.rrRatio) : undefined,
            commission: trade.commission ? Number(trade.commission) : undefined,
            openTime: trade.openTime.toISOString(),
            closeTime: trade.closeTime?.toISOString(),
            setupTagIds: tradSetups.map((t) => t.id),
            mistakeTagIds: tradMistakes.map((t) => t.id),
          }}
        />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Link href="/journal" className="flex items-center gap-1 text-sm text-zinc-400 hover:text-zinc-200">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-zinc-50">{trade.instrument}</h1>
              <span className={`inline-flex items-center gap-1 text-sm font-medium ${trade.direction === "BUY" ? "text-emerald-400" : "text-red-400"}`}>
                {trade.direction === "BUY" ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                {trade.direction}
              </span>
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${
                isOpen ? "bg-amber-500/10 text-amber-400 ring-amber-500/20"
                  : isWin ? "bg-emerald-500/10 text-emerald-400 ring-emerald-500/20"
                  : pnl < 0 ? "bg-red-500/10 text-red-400 ring-red-500/20"
                  : "bg-zinc-500/10 text-zinc-400 ring-zinc-500/20"
              }`}>
                {isOpen ? "OPEN" : isWin ? "WIN" : pnl < 0 ? "LOSS" : "BE"}
              </span>
            </div>
            <p className="text-xs text-zinc-500 mt-0.5">
              {trade.account.name} · {trade.assetClass} · {format(new Date(trade.openTime), "MMM d, yyyy HH:mm")}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setEditing(true)} className="flex items-center gap-1.5 rounded-lg border border-zinc-700 px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-800 transition-colors">
            <Pencil className="h-3.5 w-3.5" /> Edit
          </button>
          <button onClick={deleteTrade} disabled={deleting} className="flex items-center gap-1.5 rounded-lg border border-red-900/50 px-3 py-2 text-sm text-red-400 hover:bg-red-900/20 transition-colors">
            <Trash2 className="h-3.5 w-3.5" /> Delete
          </button>
        </div>
      </div>

      {/* P&L Hero */}
      <div className={`rounded-xl border p-6 ${isWin ? "border-emerald-500/20 bg-emerald-500/5" : pnl < 0 ? "border-red-500/20 bg-red-500/5" : "border-zinc-800 bg-zinc-900/60"}`}>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
          <div>
            <p className="text-xs text-zinc-500 mb-1">Net P&L</p>
            <p className={`text-3xl font-bold ${pnlColor(pnl)}`}>{isOpen ? "—" : formatCurrency(pnl)}</p>
          </div>
          <div>
            <p className="text-xs text-zinc-500 mb-1">RR Ratio</p>
            <p className="text-xl font-semibold text-zinc-200">{trade.rrRatio ? `${Number(trade.rrRatio).toFixed(2)}R` : "—"}</p>
          </div>
          <div>
            <p className="text-xs text-zinc-500 mb-1">Entry</p>
            <p className="text-xl font-mono text-zinc-200">{Number(trade.entryPrice).toFixed(5)}</p>
          </div>
          <div>
            <p className="text-xs text-zinc-500 mb-1">Exit</p>
            <p className="text-xl font-mono text-zinc-200">{trade.exitPrice ? Number(trade.exitPrice).toFixed(5) : "—"}</p>
          </div>
          <div>
            <p className="text-xs text-zinc-500 mb-1">Duration</p>
            <p className="text-xl font-semibold text-zinc-200">
              {trade.holdingMinutes != null
                ? trade.holdingMinutes >= 60
                  ? `${Math.floor(trade.holdingMinutes / 60)}h ${trade.holdingMinutes % 60}m`
                  : `${trade.holdingMinutes}m`
                : "—"}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Trade Details */}
        <div className="md:col-span-2 space-y-4">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5">
            <h2 className="text-sm font-semibold text-zinc-200 mb-4">Trade Details</h2>
            <div className="grid grid-cols-2 gap-y-3 text-sm">
              {[
                { label: "Stop Loss", value: trade.stopLoss ? Number(trade.stopLoss).toFixed(5) : "—" },
                { label: "Take Profit", value: trade.takeProfit ? Number(trade.takeProfit).toFixed(5) : "—" },
                { label: "Lot Size", value: trade.lotSize ? `${Number(trade.lotSize)} lots` : "—" },
                { label: "Risk Amount", value: trade.riskAmount ? formatCurrency(Number(trade.riskAmount)) : "—" },
                { label: "Gross P&L", value: trade.grossPnl ? formatCurrency(Number(trade.grossPnl)) : "—" },
                { label: "Commission", value: trade.commission ? formatCurrency(Number(trade.commission)) : "—" },
                { label: "Session", value: trade.session ? sessionLabel(trade.session) : "—" },
                { label: "Trade Type", value: trade.tradeType },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p className="text-zinc-500 text-xs">{label}</p>
                  <p className="text-zinc-200 font-medium mt-0.5">{value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Notes */}
          {(trade.preTradeReasoning || trade.postTradeReview || trade.notes) && (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5 space-y-4">
              <h2 className="text-sm font-semibold text-zinc-200">Notes</h2>
              {trade.preTradeReasoning && (
                <div>
                  <p className="text-xs text-zinc-500 mb-1.5">Pre-Trade Reasoning</p>
                  <p className="text-sm text-zinc-300 whitespace-pre-wrap">{trade.preTradeReasoning}</p>
                </div>
              )}
              {trade.postTradeReview && (
                <div>
                  <p className="text-xs text-zinc-500 mb-1.5">Post-Trade Review</p>
                  <p className="text-sm text-zinc-300 whitespace-pre-wrap">{trade.postTradeReview}</p>
                </div>
              )}
              {trade.notes && (
                <div>
                  <p className="text-xs text-zinc-500 mb-1.5">Notes</p>
                  <p className="text-sm text-zinc-300 whitespace-pre-wrap">{trade.notes}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Panel */}
        <div className="space-y-4">
          {/* Psychology */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5">
            <h2 className="text-sm font-semibold text-zinc-200 mb-4">Psychology</h2>
            <div className="space-y-3">
              {trade.emotionBefore && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-zinc-500">Before</span>
                  <span className="text-sm text-zinc-300">{emotionEmoji(trade.emotionBefore)} {trade.emotionBefore.charAt(0) + trade.emotionBefore.slice(1).toLowerCase()}</span>
                </div>
              )}
              {trade.emotionAfter && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-zinc-500">After</span>
                  <span className="text-sm text-zinc-300">{emotionEmoji(trade.emotionAfter)} {trade.emotionAfter.charAt(0) + trade.emotionAfter.slice(1).toLowerCase()}</span>
                </div>
              )}
              {[
                { label: "Execution", value: trade.executionScore },
                { label: "Discipline", value: trade.disciplineScore },
                { label: "Confidence", value: trade.confidenceScore },
              ].map(({ label, value }) => value != null && (
                <div key={label} className="flex items-center justify-between">
                  <span className="text-xs text-zinc-500">{label}</span>
                  <div className="flex items-center gap-1.5">
                    <div className="w-24 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${(value / 10) * 100}%` }} />
                    </div>
                    <span className="text-xs text-zinc-300 w-6">{value}/10</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* AI Coach */}
          {!isOpen && <TradeCoachCard tradeId={trade.id} />}

          {/* Tags */}
          {(tradSetups.length > 0 || tradMistakes.length > 0) && (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5">
              <h2 className="text-sm font-semibold text-zinc-200 mb-3">Tags</h2>
              <div className="flex flex-wrap gap-2">
                {tradSetups.map((tag) => (
                  <span key={tag.id} className="rounded-full px-2.5 py-1 text-xs font-medium" style={{ backgroundColor: tag.color + "22", color: tag.color }}>
                    {tag.name}
                  </span>
                ))}
                {tradMistakes.map((tag) => (
                  <span key={tag.id} className="rounded-full px-2.5 py-1 text-xs font-medium" style={{ backgroundColor: tag.color + "22", color: tag.color }}>
                    ⚠ {tag.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Screenshots */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-zinc-200">Screenshots</h2>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="flex items-center gap-1.5 rounded-lg border border-zinc-700 px-2.5 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800 disabled:opacity-50 transition-colors"
              >
                {isUploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />}
                {isUploading ? "Uploading…" : "Add"}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleFileChange}
              />
            </div>
            {screenshots.length === 0 ? (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full rounded-lg border border-dashed border-zinc-700 p-6 text-center hover:border-indigo-500/50 transition-colors"
              >
                <Upload className="h-5 w-5 text-zinc-600 mx-auto mb-1.5" />
                <p className="text-xs text-zinc-500">Click to upload chart screenshots</p>
              </button>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {screenshots.map((s) => (
                  <div key={s.id} className="relative group">
                    <a href={s.url} target="_blank" rel="noopener noreferrer">
                      <img src={s.url} alt={s.label ?? "screenshot"} className="rounded-lg border border-zinc-700 w-full h-24 object-cover hover:border-indigo-500 transition-colors" />
                    </a>
                    <button
                      onClick={() => deleteScreenshot(s.id)}
                      className="absolute top-1 right-1 rounded-full bg-zinc-950/80 p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-3 w-3 text-zinc-400" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Replay link */}
          <Link
            href={`/replay/${trade.id}`}
            className="flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 text-sm text-zinc-400 hover:border-indigo-500/30 hover:text-indigo-400 transition-all"
          >
            <Play className="h-4 w-4" />
            Trade Replay
          </Link>
        </div>
      </div>
    </div>
  );
}
