import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { playbookSchema } from "@/lib/validations/playbook";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const playbook = await db.playbook.findFirst({
    where: { id, userId: session.user.id },
    include: { setupTags: true },
  });
  if (!playbook) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(playbook);
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const existing = await db.playbook.findFirst({ where: { id, userId: session.user.id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const parsed = playbookSchema.partial().safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  const { checklist, ...rest } = parsed.data;
  const playbook = await db.playbook.update({
    where: { id },
    data: {
      ...rest,
      ...(checklist !== undefined ? { checklist: checklist === null ? Prisma.JsonNull : checklist } : {}),
    },
    include: { setupTags: true },
  });
  return NextResponse.json(playbook);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const existing = await db.playbook.findFirst({ where: { id, userId: session.user.id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await db.playbook.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
