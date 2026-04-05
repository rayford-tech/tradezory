import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { computeAnalytics } from "@/lib/analytics";
import { AnalyticsView } from "@/components/analytics/AnalyticsView";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  const session = await auth();
  const userId = session!.user!.id;

  const [trades, accounts, setupTags, mistakeTags] = await Promise.all([
    db.trade.findMany({
      where: { userId },
      include: {
        account: true,
        tradeTags: { include: { setupTag: true, mistakeTag: true } },
        screenshots: false,
      },
      orderBy: { openTime: "asc" },
    }),
    db.tradingAccount.findMany({ where: { userId }, orderBy: { isDefault: "desc" } }),
    db.setupTag.findMany({ where: { userId }, orderBy: { name: "asc" } }),
    db.mistakeTag.findMany({ where: { userId }, orderBy: { name: "asc" } }),
  ]);

  const analytics = computeAnalytics(trades as any);

  return (
    <AnalyticsView
      analytics={analytics}
      accounts={accounts}
      setupTags={setupTags}
      mistakeTags={mistakeTags}
    />
  );
}
