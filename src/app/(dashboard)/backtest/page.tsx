import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { computeAnalytics } from "@/lib/analytics";
import { BacktestView } from "@/components/backtest/BacktestView";

export const dynamic = "force-dynamic";

export default async function BacktestPage() {
  const session = await auth();
  const userId = session!.user!.id;

  const [trades, accounts] = await Promise.all([
    db.trade.findMany({
      where: { userId, tradeType: "BACKTEST" },
      include: {
        account: true,
        tradeTags: { include: { setupTag: true, mistakeTag: true } },
        screenshots: false,
      },
      orderBy: { openTime: "asc" },
    }),
    db.tradingAccount.findMany({
      where: { userId, type: "BACKTEST" },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  const analytics = computeAnalytics(trades as any);

  return <BacktestView analytics={analytics} trades={trades as any} accounts={accounts} />;
}
