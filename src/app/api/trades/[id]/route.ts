import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { tradeSchema } from "@/lib/validations/trade";
import { computeHoldingMinutes, inferSession } from "@/lib/trade-utils";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const trade = await db.trade.findFirst({
    where: { id, userId: session.user.id },
    include: {
      account: true,
      tradeTags: { include: { setupTag: true, mistakeTag: true } },
      screenshots: true,
      replayData: true,
    },
  });

  if (!trade) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(trade);
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const existing = await db.trade.findFirst({ where: { id, userId: session.user.id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const parsed = tradeSchema.partial().safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  const { setupTagIds, mistakeTagIds, openTime, closeTime, ...data } = parsed.data;

  const resolvedOpen = openTime ?? existing.openTime.toISOString();
  const resolvedClose = closeTime ?? existing.closeTime?.toISOString() ?? null;
  const holdingMinutes = resolvedClose ? computeHoldingMinutes(resolvedOpen, resolvedClose) : null;
  const inferredSession = data.session ?? (resolvedOpen ? inferSession(resolvedOpen) : null);

  // Rebuild tags if provided
  if (setupTagIds !== undefined || mistakeTagIds !== undefined) {
    await db.tradeTag.deleteMany({ where: { tradeId: id } });
  }

  const trade = await db.trade.update({
    where: { id },
    data: {
      ...data,
      ...(openTime && { openTime: new Date(openTime) }),
      ...(closeTime !== undefined && { closeTime: closeTime ? new Date(closeTime) : null }),
      holdingMinutes,
      session: inferredSession as any,
      ...(setupTagIds !== undefined || mistakeTagIds !== undefined
        ? {
            tradeTags: {
              create: [
                ...(setupTagIds ?? []).map((tid) => ({ setupTagId: tid })),
                ...(mistakeTagIds ?? []).map((tid) => ({ mistakeTagId: tid })),
              ],
            },
          }
        : {}),
    },
    include: {
      account: true,
      tradeTags: { include: { setupTag: true, mistakeTag: true } },
      screenshots: true,
    },
  });

  return NextResponse.json(trade);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const existing = await db.trade.findFirst({ where: { id, userId: session.user.id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await db.trade.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
