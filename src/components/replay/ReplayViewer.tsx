"use client";

import { useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { ArrowLeft, ChevronLeft, ChevronRight, ZoomIn, MessageSquare, Plus } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface ReplayViewerProps {
  trade: {
    id: string;
    instrument: string;
    direction: string;
    entryPrice: any;
    exitPrice: any;
    netPnl: any;
    openTime: any;
    closeTime: any;
    notes: string | null;
    screenshots: { id: string; url: string; label: string | null }[];
    replayData: any;
    account: { name: string };
  };
}

export function ReplayViewer({ trade }: ReplayViewerProps) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [note, setNote] = useState("");
  const [comments, setComments] = useState<{ text: string; screenshot: number }[]>([]);

  const screenshots = trade.screenshots;
  const hasScreenshots = screenshots.length > 0;
  const current = screenshots[currentIdx];

  const pnl = Number(trade.netPnl ?? 0);

  return (
    <div className="space-y-5 max-w-5xl mx-auto">
      <div className="flex items-center gap-3">
        <Link href={`/journal/${trade.id}`} className="text-zinc-400 hover:text-zinc-200">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-zinc-50">Trade Replay — {trade.instrument}</h1>
          <p className="text-xs text-zinc-500">
            {trade.account.name} · {format(new Date(trade.openTime), "MMM d, yyyy HH:mm")}
            {trade.closeTime && ` → ${format(new Date(trade.closeTime), "HH:mm")}`}
          </p>
        </div>
        <div className="ml-auto">
          <span className={`text-lg font-bold ${pnl > 0 ? "text-emerald-400" : pnl < 0 ? "text-red-400" : "text-zinc-400"}`}>
            {formatCurrency(pnl)}
          </span>
        </div>
      </div>

      {!hasScreenshots ? (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-12 text-center">
          <p className="text-zinc-400 text-sm mb-2">No screenshots uploaded for this trade</p>
          <p className="text-zinc-500 text-xs">Upload chart screenshots from the trade detail page to enable replay</p>
          <Link href={`/journal/${trade.id}`} className="mt-4 inline-block text-sm text-indigo-400 hover:text-indigo-300">
            Go to trade detail →
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Main viewer */}
          <div className="lg:col-span-2 space-y-3">
            <div className="relative rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden">
              <img
                src={current.url}
                alt={current.label ?? `Screenshot ${currentIdx + 1}`}
                className="w-full object-contain max-h-[500px]"
              />
              {/* Navigation */}
              {screenshots.length > 1 && (
                <>
                  <button
                    onClick={() => setCurrentIdx((i) => Math.max(0, i - 1))}
                    disabled={currentIdx === 0}
                    className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-zinc-900/80 border border-zinc-700 p-2 text-zinc-400 hover:text-zinc-200 disabled:opacity-30"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setCurrentIdx((i) => Math.min(screenshots.length - 1, i + 1))}
                    disabled={currentIdx === screenshots.length - 1}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-zinc-900/80 border border-zinc-700 p-2 text-zinc-400 hover:text-zinc-200 disabled:opacity-30"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </>
              )}
              {/* Label badge */}
              {current.label && (
                <div className="absolute top-3 left-3 rounded-full bg-zinc-900/90 border border-zinc-700 px-3 py-1 text-xs text-zinc-300">
                  {current.label}
                </div>
              )}
              {/* Counter */}
              <div className="absolute bottom-3 right-3 rounded-full bg-zinc-900/90 border border-zinc-700 px-3 py-1 text-xs text-zinc-400">
                {currentIdx + 1} / {screenshots.length}
              </div>
            </div>

            {/* Thumbnail strip */}
            {screenshots.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {screenshots.map((s, i) => (
                  <button
                    key={s.id}
                    onClick={() => setCurrentIdx(i)}
                    className={`shrink-0 rounded-lg overflow-hidden border-2 transition-colors ${i === currentIdx ? "border-indigo-500" : "border-zinc-700 hover:border-zinc-500"}`}
                  >
                    <img src={s.url} alt={s.label ?? `${i + 1}`} className="h-16 w-24 object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Side panel */}
          <div className="space-y-4">
            {/* Trade summary */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 space-y-2 text-sm">
              <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Trade Summary</h3>
              {[
                { label: "Direction", value: trade.direction },
                { label: "Entry", value: Number(trade.entryPrice).toFixed(5) },
                { label: "Exit", value: trade.exitPrice ? Number(trade.exitPrice).toFixed(5) : "—" },
                { label: "P&L", value: formatCurrency(pnl) },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between">
                  <span className="text-zinc-500">{label}</span>
                  <span className="text-zinc-200">{value}</span>
                </div>
              ))}
            </div>

            {/* Original notes */}
            {trade.notes && (
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
                <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Notes</h3>
                <p className="text-sm text-zinc-300 whitespace-pre-wrap">{trade.notes}</p>
              </div>
            )}

            {/* Replay comments */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 space-y-3">
              <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Replay Comments</h3>
              {comments.map((c, i) => (
                <div key={i} className="rounded-lg bg-zinc-800 px-3 py-2 text-xs text-zinc-300">
                  <span className="text-zinc-500">Screenshot {c.screenshot + 1}:</span> {c.text}
                </div>
              ))}
              <div className="flex gap-2">
                <input
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && note.trim()) {
                      setComments([...comments, { text: note.trim(), screenshot: currentIdx }]);
                      setNote("");
                    }
                  }}
                  placeholder="Add observation..."
                  className="flex-1 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-xs text-zinc-100 placeholder:text-zinc-500 focus:border-indigo-500 focus:outline-none"
                />
                <button
                  onClick={() => {
                    if (note.trim()) {
                      setComments([...comments, { text: note.trim(), screenshot: currentIdx }]);
                      setNote("");
                    }
                  }}
                  className="rounded-lg bg-zinc-800 border border-zinc-700 px-2 py-2 text-zinc-400 hover:text-zinc-200"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
