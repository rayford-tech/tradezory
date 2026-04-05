import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { computeAnalytics } from "@/lib/analytics";

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
  const tradeType = searchParams.get("tradeType");
  const instrument = searchParams.get("instrument");

  const trades = await db.trade.findMany({
    where: {
      userId: session.user.id,
      ...(accountId && { accountId }),
      ...(assetClass && { assetClass: assetClass as any }),
      ...(tradeSession && { session: tradeSession as any }),
      ...(direction && { direction: direction as any }),
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
    orderBy: { openTime: "asc" },
  });

  const result = computeAnalytics(trades as any);
  return NextResponse.json(result);
}
