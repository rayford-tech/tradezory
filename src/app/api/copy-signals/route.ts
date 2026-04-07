import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// GET — EA polls for pending signals; optionally marks one as executed
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if ((session.user as any).role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const signalId = searchParams.get("signalId");
  const ticket = searchParams.get("ticket");

  // EA confirms execution
  if (signalId && ticket) {
    await db.copySignal.update({
      where: { id: signalId },
      data: { status: "EXECUTED", executedAt: new Date() },
    });
    return NextResponse.json({ ok: true });
  }

  const signals = await db.copySignal.findMany({
    where: { adminId: session.user.id, status: "PENDING" },
    orderBy: { createdAt: "asc" },
    take: 20,
  });

  return NextResponse.json({ signals });
}

// DELETE — cancel a specific signal
export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if ((session.user as any).role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { signalId } = await req.json();
  if (!signalId) return NextResponse.json({ error: "signalId required" }, { status: 400 });

  await db.copySignal.updateMany({
    where: { id: signalId, adminId: session.user.id, status: "PENDING" },
    data: { status: "CANCELLED" },
  });

  return NextResponse.json({ ok: true });
}
