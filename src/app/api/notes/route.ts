import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const noteSchema = z.object({
  type: z.enum(["PRE_MARKET", "POST_MARKET", "WEEKLY", "MONTHLY", "LESSON"]),
  date: z.string().datetime(),
  content: z.string().min(1),
});

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");
  const date = searchParams.get("date");

  const notes = await db.note.findMany({
    where: {
      userId: session.user.id,
      ...(type && { type: type as any }),
      ...(date && { date: { gte: new Date(date), lt: new Date(new Date(date).getTime() + 86400000) } }),
    },
    orderBy: { date: "desc" },
  });
  return NextResponse.json(notes);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = noteSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  const note = await db.note.create({
    data: { ...parsed.data, userId: session.user.id, date: new Date(parsed.data.date) },
  });
  return NextResponse.json(note, { status: 201 });
}
