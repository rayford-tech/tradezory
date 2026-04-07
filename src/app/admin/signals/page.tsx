import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { SignalsView } from "@/components/admin/SignalsView";

export const dynamic = "force-dynamic";

export default async function SignalsPage() {
  const session = await auth();
  const adminId = session!.user!.id;

  const signals = await db.copySignal.findMany({
    where: { adminId },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      sourceTrade: {
        select: {
          user: { select: { name: true, email: true } },
        },
      },
    },
  });

  const serialized = signals.map((s) => ({
    id: s.id,
    instrument: s.instrument,
    direction: s.direction,
    volume: s.volume,
    openPrice: s.openPrice,
    stopLoss: s.stopLoss,
    takeProfit: s.takeProfit,
    status: s.status,
    createdAt: s.createdAt.toISOString(),
    executedAt: s.executedAt?.toISOString() ?? null,
    trader: s.sourceTrade.user.name ?? s.sourceTrade.user.email,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-zinc-50">Copy Signals</h1>
        <p className="text-sm text-zinc-400 mt-1">Trades from followed traders. Your MT5 EA polls this to auto-execute.</p>
      </div>
      <SignalsView signals={serialized} />
    </div>
  );
}
