import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { TradeTable } from "@/components/journal/TradeTable";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function JournalPage() {
  const session = await auth();
  const userId = session!.user!.id;

  const [trades, accounts, setupTags, mistakeTags] = await Promise.all([
    db.trade.findMany({
      where: { userId },
      include: {
        account: true,
        tradeTags: { include: { setupTag: true, mistakeTag: true } },
        screenshots: { take: 1 },
      },
      orderBy: { openTime: "desc" },
    }),
    db.tradingAccount.findMany({ where: { userId }, orderBy: { isDefault: "desc" } }),
    db.setupTag.findMany({ where: { userId }, orderBy: { name: "asc" } }),
    db.mistakeTag.findMany({ where: { userId }, orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-zinc-50">Trade Journal</h1>
          <p className="text-sm text-zinc-400">{trades.length} total trades</p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/import"
            className="rounded-lg border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-300 hover:bg-zinc-800 transition-colors"
          >
            Import CSV
          </Link>
          <Link
            href="/journal/new"
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 transition-colors"
          >
            + Add Trade
          </Link>
        </div>
      </div>
      <TradeTable
        trades={trades as any}
        accounts={accounts}
        setupTags={setupTags}
        mistakeTags={mistakeTags}
      />
    </div>
  );
}
