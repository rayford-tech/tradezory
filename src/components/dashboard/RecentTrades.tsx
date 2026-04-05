import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
import type { TradeWithRelations } from "@/types";
import { ArrowUpRight, ArrowDownRight, ExternalLink } from "lucide-react";
import { format } from "date-fns";

interface RecentTradesProps {
  trades: TradeWithRelations[];
}

export function RecentTrades({ trades }: RecentTradesProps) {
  if (trades.length === 0) {
    return (
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-8 text-center">
        <p className="text-zinc-500 text-sm">No recent trades.</p>
        <Link
          href="/journal/new"
          className="mt-3 inline-block text-sm text-indigo-400 hover:text-indigo-300"
        >
          Log your first trade →
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/60">
      <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
        <h2 className="text-sm font-semibold text-zinc-200">Recent Trades</h2>
        <Link href="/journal" className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
          View all <ExternalLink className="h-3 w-3" />
        </Link>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-800">
              <th className="px-5 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Instrument</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Direction</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Entry</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">P&L</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">RR</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Date</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody>
            {trades.map((trade) => {
              const pnl = Number(trade.netPnl ?? 0);
              const isWin = pnl > 0;
              const isOpen = trade.status === "OPEN";

              return (
                <tr key={trade.id} className="border-b border-zinc-800/60 hover:bg-zinc-800/30 transition-colors">
                  <td className="px-5 py-3">
                    <Link href={`/journal/${trade.id}`} className="font-medium text-zinc-100 hover:text-indigo-400 transition-colors">
                      {trade.instrument}
                    </Link>
                    <p className="text-xs text-zinc-500">{trade.assetClass}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 text-xs font-medium ${trade.direction === "BUY" ? "text-emerald-400" : "text-red-400"}`}>
                      {trade.direction === "BUY" ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                      {trade.direction}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-zinc-300">{Number(trade.entryPrice).toFixed(5)}</td>
                  <td className="px-4 py-3">
                    {isOpen ? (
                      <span className="text-zinc-500">Open</span>
                    ) : (
                      <span className={`font-medium ${isWin ? "text-emerald-400" : pnl < 0 ? "text-red-400" : "text-zinc-400"}`}>
                        {formatCurrency(pnl)}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-zinc-400">
                    {trade.rrRatio ? `${Number(trade.rrRatio).toFixed(2)}R` : "—"}
                  </td>
                  <td className="px-4 py-3 text-zinc-500 text-xs">
                    {format(new Date(trade.openTime), "MMM d, HH:mm")}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-medium ring-1 ring-inset ${
                      isOpen
                        ? "bg-amber-500/10 text-amber-400 ring-amber-500/20"
                        : isWin
                        ? "bg-emerald-500/10 text-emerald-400 ring-emerald-500/20"
                        : pnl < 0
                        ? "bg-red-500/10 text-red-400 ring-red-500/20"
                        : "bg-zinc-500/10 text-zinc-400 ring-zinc-500/20"
                    }`}>
                      {isOpen ? "OPEN" : isWin ? "WIN" : pnl < 0 ? "LOSS" : "BE"}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
