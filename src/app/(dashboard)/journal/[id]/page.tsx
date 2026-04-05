import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { TradeDetail } from "@/components/journal/TradeDetail";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function TradeDetailPage({ params }: Props) {
  const session = await auth();
  const userId = session!.user!.id;
  const { id } = await params;

  const [trade, accounts, setupTags, mistakeTags] = await Promise.all([
    db.trade.findFirst({
      where: { id, userId },
      include: {
        account: true,
        tradeTags: { include: { setupTag: true, mistakeTag: true } },
        screenshots: true,
        replayData: true,
      },
    }),
    db.tradingAccount.findMany({ where: { userId }, orderBy: { isDefault: "desc" } }),
    db.setupTag.findMany({ where: { userId }, orderBy: { name: "asc" } }),
    db.mistakeTag.findMany({ where: { userId }, orderBy: { name: "asc" } }),
  ]);

  if (!trade) notFound();

  return (
    <TradeDetail
      trade={trade as any}
      accounts={accounts}
      setupTags={setupTags}
      mistakeTags={mistakeTags}
    />
  );
}
