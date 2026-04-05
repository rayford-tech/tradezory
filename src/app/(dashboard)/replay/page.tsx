import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import Link from "next/link";
import { Play } from "lucide-react";
import { format } from "date-fns";

export const dynamic = "force-dynamic";

export default async function ReplayIndexPage() {
  const session = await auth();
  const userId = session!.user!.id;

  const trades = await db.trade.findMany({
    where: { userId, screenshots: { some: {} } },
    include: { screenshots: { take: 1 } },
    orderBy: { openTime: "desc" },
    take: 20,
  });

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-zinc-50">Trade Replay</h1>
        <p className="text-sm text-zinc-400">Review trades with uploaded screenshots</p>
      </div>

      {trades.length === 0 ? (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-12 text-center">
          <Play className="h-8 w-8 text-zinc-600 mx-auto mb-3" />
          <p className="text-zinc-400 text-sm">No trades with screenshots yet</p>
          <p className="text-zinc-500 text-xs mt-1">Upload chart screenshots to a trade to enable replay</p>
          <Link href="/journal" className="mt-4 inline-block text-sm text-indigo-400 hover:text-indigo-300">
            Go to journal →
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {trades.map((trade) => (
            <Link
              key={trade.id}
              href={`/replay/${trade.id}`}
              className="group rounded-xl border border-zinc-800 bg-zinc-900/60 overflow-hidden hover:border-indigo-500/30 transition-all"
            >
              {trade.screenshots[0] && (
                <div className="relative overflow-hidden">
                  <img src={trade.screenshots[0].url} alt="screenshot" className="w-full h-36 object-cover" />
                  <div className="absolute inset-0 flex items-center justify-center bg-zinc-950/60 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Play className="h-8 w-8 text-white" />
                  </div>
                </div>
              )}
              <div className="p-4">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-semibold text-zinc-200">{trade.instrument}</p>
                  <span className={`text-sm font-bold ${Number(trade.netPnl ?? 0) > 0 ? "text-emerald-400" : Number(trade.netPnl ?? 0) < 0 ? "text-red-400" : "text-zinc-400"}`}>
                    {trade.status === "OPEN" ? "OPEN" : `$${Number(trade.netPnl ?? 0).toFixed(2)}`}
                  </span>
                </div>
                <p className="text-xs text-zinc-500">{format(new Date(trade.openTime), "MMM d, yyyy")} · {trade.direction}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
