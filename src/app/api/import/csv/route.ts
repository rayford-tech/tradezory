import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { parseCsv, mapRows } from "@/lib/csv-parser";
import { inferSession } from "@/lib/trade-utils";
import { z } from "zod";

const importSchema = z.object({
  accountId: z.string().min(1),
  csvContent: z.string().min(1),
  mapping: z.record(z.string(), z.string()),
  tradeType: z.enum(["LIVE", "DEMO", "BACKTEST"]).default("LIVE"),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = importSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  const { accountId, csvContent, mapping, tradeType } = parsed.data;

  // Verify account belongs to user
  const account = await db.tradingAccount.findFirst({
    where: { id: accountId, userId: session.user.id },
  });
  if (!account) return NextResponse.json({ error: "Account not found" }, { status: 404 });

  const { rows } = parseCsv(csvContent);
  const trades = mapRows(rows, mapping as any);

  if (trades.length === 0) {
    return NextResponse.json({ error: "No valid trades found in CSV" }, { status: 400 });
  }

  let imported = 0;
  let skipped = 0;

  for (const trade of trades) {
    // Skip duplicates by externalId
    if (trade.externalId) {
      const existing = await db.trade.findFirst({
        where: { externalId: trade.externalId, accountId },
      });
      if (existing) { skipped++; continue; }
    }

    const holdingMinutes =
      trade.closeTime && trade.openTime
        ? Math.round((new Date(trade.closeTime).getTime() - new Date(trade.openTime).getTime()) / 60000)
        : null;

    await db.trade.create({
      data: {
        userId: session.user.id,
        accountId,
        instrument: trade.instrument,
        assetClass: trade.assetClass,
        direction: trade.direction,
        entryPrice: trade.entryPrice,
        exitPrice: trade.exitPrice ?? null,
        stopLoss: trade.stopLoss ?? null,
        takeProfit: trade.takeProfit ?? null,
        lotSize: trade.lotSize ?? null,
        grossPnl: trade.grossPnl ?? null,
        netPnl: trade.netPnl ?? null,
        commission: trade.commission ?? null,
        swap: trade.swap ?? null,
        openTime: new Date(trade.openTime),
        closeTime: trade.closeTime ? new Date(trade.closeTime) : null,
        holdingMinutes,
        session: inferSession(trade.openTime) as any,
        status: trade.status,
        tradeType: tradeType as any,
        notes: trade.notes ?? null,
        externalId: trade.externalId ?? null,
        brokerMetadata: trade.brokerMetadata as any,
      },
    });
    imported++;
  }

  return NextResponse.json({ imported, skipped, total: trades.length });
}
