import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { decrypt } from "@/lib/encryption";
import { getDeals, mapDealDirection, isMetaApiConfigured } from "@/lib/metaapi";
import { inferSession } from "@/lib/trade-utils";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const conn = await db.brokerConnection.findUnique({ where: { id } });
  if (!conn || conn.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (!isMetaApiConfigured()) {
    return NextResponse.json({
      error: "MetaApi not configured. Add METAAPI_TOKEN to environment variables.",
      setupUrl: "https://app.metaapi.cloud",
    }, { status: 503 });
  }

  if (!conn.metaApiAccountId) {
    return NextResponse.json({ error: "Broker not provisioned on MetaApi yet. Please wait or reconnect." }, { status: 400 });
  }

  // Determine the trading account to store trades under
  const tradingAccount = conn.tradingAccountId
    ? await db.tradingAccount.findUnique({ where: { id: conn.tradingAccountId } })
    : await db.tradingAccount.findFirst({ where: { userId: session.user.id, isDefault: true } });

  if (!tradingAccount) {
    return NextResponse.json({ error: "No trading account linked. Please link an account to this connection." }, { status: 400 });
  }

  await db.brokerConnection.update({
    where: { id },
    data: { status: "CONNECTING" },
  });

  try {
    const fromDate = conn.syncFromDate?.toISOString() ?? conn.lastSyncAt?.toISOString();
    const deals = await getDeals(conn.metaApiAccountId, fromDate ?? undefined);

    // Group deals by positionId to reconstruct trades (entry + exit pairs)
    const positionMap = new Map<string, { entry?: any; exit?: any }>();
    for (const deal of deals) {
      if (!["DEAL_TYPE_BUY", "DEAL_TYPE_SELL"].includes(deal.type)) continue;
      const pos = positionMap.get(deal.positionId) ?? {};
      if (deal.entryType === "DEAL_ENTRY_IN") pos.entry = deal;
      else if (deal.entryType === "DEAL_ENTRY_OUT") pos.exit = deal;
      positionMap.set(deal.positionId, pos);
    }

    let imported = 0;
    let skipped = 0;

    for (const [positionId, { entry, exit }] of positionMap.entries()) {
      if (!entry) { skipped++; continue; }

      const externalId = positionId;
      const existing = await db.trade.findFirst({ where: { externalId, accountId: tradingAccount.id } });
      if (existing) { skipped++; continue; }

      const openTime = new Date(entry.time);
      const closeTime = exit ? new Date(exit.time) : null;
      const holdingMinutes = closeTime
        ? Math.round((closeTime.getTime() - openTime.getTime()) / 60000)
        : null;

      const grossPnl = (exit?.profit ?? 0);
      const commission = (entry.commission ?? 0) + (exit?.commission ?? 0);
      const swap = (entry.swap ?? 0) + (exit?.swap ?? 0);
      const netPnl = grossPnl + commission + swap;

      await db.trade.create({
        data: {
          userId: session.user.id,
          accountId: tradingAccount.id,
          instrument: entry.symbol,
          assetClass: "FOREX",
          direction: mapDealDirection(entry.type),
          entryPrice: entry.price,
          exitPrice: exit?.price ?? null,
          lotSize: entry.volume,
          grossPnl,
          netPnl,
          commission: commission || null,
          swap: swap || null,
          openTime,
          closeTime,
          holdingMinutes,
          session: inferSession(openTime.toISOString()),
          status: exit ? "CLOSED" : "OPEN",
          tradeType: tradingAccount.type === "DEMO" ? "DEMO" : "LIVE",
          externalId,
          brokerMetadata: { entry, exit } as any,
        },
      });
      imported++;
    }

    await db.brokerConnection.update({
      where: { id },
      data: {
        status: "ACTIVE",
        lastSyncAt: new Date(),
        lastError: null,
        tradesImported: { increment: imported },
      },
    });

    return NextResponse.json({ success: true, imported, skipped, total: positionMap.size });
  } catch (err: any) {
    await db.brokerConnection.update({
      where: { id },
      data: { status: "ERROR", lastError: err.message },
    });
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
