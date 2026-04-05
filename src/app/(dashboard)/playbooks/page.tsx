import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { PlaybookList } from "@/components/playbooks/PlaybookList";

export const dynamic = "force-dynamic";

export default async function PlaybooksPage() {
  const session = await auth();
  const userId = session!.user!.id;

  const playbooks = await db.playbook.findMany({
    where: { userId },
    include: { setupTags: true },
    orderBy: { createdAt: "desc" },
  });

  return <PlaybookList playbooks={playbooks} />;
}
