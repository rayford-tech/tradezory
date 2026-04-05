import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { tradeSchema } from "@/lib/validations/trade";
import { computeHoldingMinutes, inferSession } from "@/lib/trade-utils";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const accountId = searchParams.get("accountId");
  const dateFrom = searchParams.get("dateFrom");
  const dateTo = searchParams.get("dateTo");
  const assetClass = searchParams.get("assetClass");
  const tradeSession = searchParams.get("session");
  const direction = searchParams.get("direction");
  const status = searchParams.get("status");
  const tradeType = searchParams.get("tradeType");
  const instrument = searchParams.get("instrument");

  const trades = await db.trade.findMany({
    where: {
      userId: session.user.id,
      ...(accountId && { accountId }),
      ...(assetClass && { assetClass: assetClass as any }),
      ...(tradeSession && { session: tradeSession as any }),
      ...(direction && { direction: direction as any }),
      ...(status && { status: status as any }),
      ...(tradeType && { tradeType: tradeType as any }),
      ...(instrument && { instrument: { contains: instrument, mode: "insensitive" } }),
      ...(dateFrom || dateTo
        ? {
            openTime: {
              ...(dateFrom && { gte: new Date(dateFrom) }),
              ...(dateTo && { lte: new Date(dateTo) }),
            },
          }
        : {}),
    },
    include: {
      account: true,
      tradeTags: { include: { setupTag: true, mistakeTag: true } },
      screenshots: true,
    },
    orderBy: { openTime: "desc" },
  });

  return NextResponse.json(trades);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = tradeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }

  const { setupTagIds, mistakeTagIds, openTime, closeTime, ...data } = parsed.data;

  const holdingMinutes =
    closeTime && openTime ? computeHoldingMinutes(openTime, closeTime) : null;

  const inferredSession = data.session ?? (openTime ? inferSession(openTime) : null);

  const trade = await db.trade.create({
    data: {
      ...data,
      userId: session.user.id,
      openTime: new Date(openTime),
      closeTime: closeTime ? new Date(closeTime) : null,
      holdingMinutes,
      session: inferredSession as any,
      tradeTags: {
        create: [
          ...(setupTagIds ?? []).map((id) => ({ setupTagId: id })),
          ...(mistakeTagIds ?? []).map((id) => ({ mistakeTagId: id })),
        ],
      },
    },
    include: {
      account: true,
      tradeTags: { include: { setupTag: true, mistakeTag: true } },
      screenshots: true,
    },
  });

  return NextResponse.json(trade, { status: 201 });
}
