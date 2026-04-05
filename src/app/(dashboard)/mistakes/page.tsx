import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { computeAnalytics } from "@/lib/analytics";
import { MistakesView } from "@/components/mistakes/MistakesView";

export const dynamic = "force-dynamic";

export default async function MistakesPage() {
  const session = await auth();
  const userId = session!.user!.id;

  const [trades, mistakeTags] = await Promise.all([
    db.trade.findMany({
      where: { userId },
      include: {
        account: true,
        tradeTags: { include: { setupTag: true, mistakeTag: true } },
        screenshots: false,
      },
      orderBy: { openTime: "asc" },
    }),
    db.mistakeTag.findMany({ where: { userId }, orderBy: { name: "asc" } }),
  ]);

  const analytics = computeAnalytics(trades as any);

  return <MistakesView analytics={analytics} mistakeTags={mistakeTags} />;
}
