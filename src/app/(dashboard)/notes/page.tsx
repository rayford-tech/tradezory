import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NotesView } from "@/components/notes/NotesView";

export const dynamic = "force-dynamic";

export default async function NotesPage() {
  const session = await auth();
  const userId = session!.user!.id;

  const notes = await db.note.findMany({
    where: { userId },
    orderBy: { date: "desc" },
  });

  return <NotesView notes={notes} />;
}
