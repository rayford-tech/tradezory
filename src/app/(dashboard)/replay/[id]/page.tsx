import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { ReplayViewer } from "@/components/replay/ReplayViewer";

type Props = { params: Promise<{ id: string }> };

export default async function ReplayPage({ params }: Props) {
  const session = await auth();
  const userId = session!.user!.id;
  const { id } = await params;

  const trade = await db.trade.findFirst({
    where: { id, userId },
    include: {
      screenshots: true,
      replayData: true,
      account: true,
    },
  });

  if (!trade) notFound();
  return <ReplayViewer trade={trade as any} />;
}
