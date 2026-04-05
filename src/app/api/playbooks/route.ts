import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { playbookSchema } from "@/lib/validations/playbook";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const playbooks = await db.playbook.findMany({
    where: { userId: session.user.id },
    include: { setupTags: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(playbooks);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = playbookSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  const playbook = await db.playbook.create({
    data: { ...parsed.data, userId: session.user.id, checklist: parsed.data.checklist ?? [] },
    include: { setupTags: true },
  });
  return NextResponse.json(playbook, { status: 201 });
}
