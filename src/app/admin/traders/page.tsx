import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { TradersTable } from "@/components/admin/TradersTable";

export const dynamic = "force-dynamic";

export default async function TradersPage() {
  const session = await auth();
  const adminId = session!.user!.id;

  const users = await db.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      plan: true,
      createdAt: true,
      followers: { where: { adminId }, select: { id: true } },
      trades: {
        where: { status: "CLOSED" },
        select: { netPnl: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const traders = users
    .map((u) => {
      const closed = u.trades;
      const wins = closed.filter((t) => Number(t.netPnl ?? 0) > 0).length;
      const winRate = closed.length > 0 ? wins / closed.length : 0;
      const netPnl = closed.reduce((s, t) => s + Number(t.netPnl ?? 0), 0);
      return {
        id: u.id,
        name: u.name ?? "Unknown",
        email: u.email,
        plan: u.plan,
        joinedAt: u.createdAt.toISOString(),
        closedTrades: closed.length,
        winRate,
        netPnl,
        isFollowed: u.followers.length > 0,
      };
    })
    .sort((a, b) => b.winRate - a.winRate);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-zinc-50">Traders</h1>
        <p className="text-sm text-zinc-400 mt-1">All users ranked by win rate. Follow to copy their trades.</p>
      </div>
      <TradersTable traders={traders} />
    </div>
  );
}
