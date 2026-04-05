import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createHmac } from "crypto";
import { inferSession } from "@/lib/trade-utils";
import type { MT5WebhookPayload } from "@/types";

// Verify HMAC-SHA256 signature from MT5 EA
function verifySignature(body: string, signature: string): boolean {
  const secret = process.env.MT5_WEBHOOK_SECRET;
  if (!secret) return false;
  const expected = createHmac("sha256", secret).update(body).digest("hex");
  return signature === expected;
}

function mapMT5Type(type: string): "BUY" | "SELL" {
  return type.toUpperCase().includes("BUY") ? "BUY" : "SELL";
}

/**
 * POST /api/mt5/webhook
 * Called by the TradeForge MT5 Expert Advisor on every trade event.
 * Header: X-TradeForge-Signature: <hmac-sha256 of body>
 * Header: X-TradeForge-AccountId: <tradingAccount.id>
 */
export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-tradeforge-signature") ?? "";
  const accountId = req.headers.get("x-tradeforge-account-id");

  if (!verifySignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  if (!accountId) {
    return NextResponse.json({ error: "Missing account ID header" }, { status: 400 });
  }

  let payload: MT5WebhookPayload;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Verify the account exists
  const account = await db.tradingAccount.findFirst({ where: { id: accountId } });
  if (!account) {
    return NextResponse.json({ error: "Account not found" }, { status: 404 });
  }

  const openTime = new Date(payload.openTime);
  const closeTime = payload.closeTime ? new Date(payload.closeTime) : null;
  const holdingMinutes = closeTime
    ? Math.round((closeTime.getTime() - openTime.getTime()) / 60000)
    : null;

  // Upsert by externalId so re-sends from EA are idempotent
  const externalId = String(payload.ticket);
  const existing = await db.trade.findFirst({
    where: { externalId, accountId },
  });

  const tradeData = {
    instrument: payload.symbol,
    assetClass: "FOREX" as const, // EA can send asset class; default FOREX
    direction: mapMT5Type(payload.type),
    entryPrice: payload.openPrice,
    exitPrice: payload.closePrice ?? null,
    stopLoss: payload.sl || null,
    takeProfit: payload.tp || null,
    lotSize: payload.volume,
    grossPnl: payload.profit,
    netPnl: payload.profit - Math.abs(payload.commission ?? 0) - Math.abs(payload.swap ?? 0),
    commission: payload.commission ?? null,
    swap: payload.swap ?? null,
    openTime,
    closeTime,
    holdingMinutes,
    session: inferSession(openTime.toISOString()),
    status: closeTime ? ("CLOSED" as const) : ("OPEN" as const),
    tradeType: account.type === "DEMO" ? ("DEMO" as const) : ("LIVE" as const),
    notes: payload.comment ?? null,
    externalId,
    brokerMetadata: payload as any,
  };

  let trade;
  if (existing) {
    trade = await db.trade.update({ where: { id: existing.id }, data: tradeData });
  } else {
    trade = await db.trade.create({
      data: { ...tradeData, userId: account.userId, accountId },
    });
  }

  return NextResponse.json({ success: true, tradeId: trade.id });
}
