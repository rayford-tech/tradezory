import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { PlaybookDetail } from "@/components/playbooks/PlaybookDetail";

type Props = { params: Promise<{ id: string }> };

export default async function PlaybookDetailPage({ params }: Props) {
  const session = await auth();
  const userId = session!.user!.id;
  const { id } = await params;

  const [playbook, setupTags] = await Promise.all([
    db.playbook.findFirst({ where: { id, userId }, include: { setupTags: true } }),
    db.setupTag.findMany({ where: { userId }, orderBy: { name: "asc" } }),
  ]);

  if (!playbook) notFound();
  return <PlaybookDetail playbook={playbook as any} allSetupTags={setupTags} />;
}
