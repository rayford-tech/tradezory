import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if ((session.user as any).role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { userId } = await req.json();
  if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });

  const existing = await db.copyFollow.findUnique({
    where: { adminId_followedUserId: { adminId: session.user.id, followedUserId: userId } },
  });

  if (existing) {
    await db.copyFollow.delete({ where: { id: existing.id } });
    return NextResponse.json({ following: false });
  }

  await db.copyFollow.create({ data: { adminId: session.user.id, followedUserId: userId } });
  return NextResponse.json({ following: true });
}
