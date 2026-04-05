import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const tagSchema = z.object({
  name: z.string().min(1).max(50),
  category: z.string().optional().nullable(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).default("#ef4444"),
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const tags = await db.mistakeTag.findMany({
    where: { userId: session.user.id },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(tags);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = tagSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  const tag = await db.mistakeTag.create({
    data: { ...parsed.data, userId: session.user.id },
  });
  return NextResponse.json(tag, { status: 201 });
}
