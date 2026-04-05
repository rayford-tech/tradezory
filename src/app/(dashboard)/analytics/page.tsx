import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { computeAnalytics } from "@/lib/analytics";
import { AnalyticsView } from "@/components/analytics/AnalyticsView";

export const dynamic = "force-dynamic";

interface AnalyticsPageProps {
  searchParams: Promise<{
    dateFrom?: string;
    dateTo?: string;
    accountId?: string;
    assetClass?: string;
    direction?: string;
  }>;
}

export default async function AnalyticsPage({ searchParams }: AnalyticsPageProps) {
  const session = await auth();
  const userId = session!.user!.id;
  const sp = await searchParams;

  const where: Record<string, any> = { userId };
  if (sp.dateFrom) where.openTime = { ...where.openTime, gte: new Date(sp.dateFrom) };
  if (sp.dateTo) where.openTime = { ...where.openTime, lte: new Date(sp.dateTo) };
  if (sp.accountId) where.accountId = sp.accountId;
  if (sp.assetClass) where.assetClass = sp.assetClass;
  if (sp.direction) where.direction = sp.direction;

  const [trades, accounts, setupTags, mistakeTags] = await Promise.all([
    db.trade.findMany({
      where,
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
      filters={{
        dateFrom: sp.dateFrom ?? "",
        dateTo: sp.dateTo ?? "",
        accountId: sp.accountId ?? "",
        assetClass: sp.assetClass ?? "",
        direction: sp.direction ?? "",
      }}
    />
  );
}
