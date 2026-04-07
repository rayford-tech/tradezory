import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { inferSession } from "@/lib/trade-utils";
import type { MT5WebhookPayload } from "@/types";

/**
 * Verify the EA's signature: "secret|timestamp"
 * Allow 5-minute window to prevent replay attacks.
 */
function verifySignature(signature: string): boolean {
  const secret = process.env.MT5_WEBHOOK_SECRET?.trim();
  if (!secret) return false;
  const parts = signature.split("|");
  if (parts.length !== 2) return false;
  if (parts[0] !== secret) return false;
  const ts = Number(parts[1]);
  if (isNaN(ts)) return false;
  const ageSeconds = Math.abs(Math.floor(Date.now() / 1000) - ts);
  return ageSeconds < 300; // 5-minute window
}

/**
 * MT5 sends dates as "YYYY.MM.DD HH:MM:SS" — convert to ISO for JS Date parsing.
 */
function parseMT5Date(str: string): Date | null {
  if (!str) return null;
  // Replace dots in date part with dashes, space with T, append Z
  const iso = str.replace(/^(\d{4})\.(\d{2})\.(\d{2}) /, "$1-$2-$3T") + "Z";
  const d = new Date(iso);
  return isNaN(d.getTime()) ? null : d;
}

function mapMT5Type(type: string): "BUY" | "SELL" {
  return type.toUpperCase().includes("BUY") ? "BUY" : "SELL";
}

/**
 * POST /api/mt5/webhook
 * Called by the Tradezory MT5 Expert Advisor on every trade event.
 * Header: X-Tradezory-Signature: <secret>|<timestamp>
 * Header: X-Tradezory-Account-Id: <tradingAccount.id>
 */
export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-tradezory-signature") ?? "";
  const accountId = req.headers.get("x-tradezory-account-id");

  if (!verifySignature(signature)) {
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

  const openTime = parseMT5Date(payload.openTime);
  const closeTime = parseMT5Date(payload.closeTime ?? "");

  if (!openTime) {
    return NextResponse.json({ error: "Invalid openTime format" }, { status: 400 });
  }

  const holdingMinutes = closeTime
    ? Math.round((closeTime.getTime() - openTime.getTime()) / 60000)
    : null;

  const isClosingDeal = !!closeTime;

  // Upsert by externalId so re-sends from EA are idempotent
  const externalId = String(payload.ticket);

  const tradeData = {
    instrument: payload.symbol,
    assetClass: payload.symbol.includes("BTC") || payload.symbol.includes("ETH") || payload.symbol.includes("XRP")
      ? "CRYPTO" as const
      : payload.symbol.includes("US30") || payload.symbol.includes("NAS") || payload.symbol.includes("SPX")
      ? "INDICES" as const
      : payload.symbol.includes("XAU") || payload.symbol.includes("OIL") || payload.symbol.includes("WTI")
      ? "COMMODITIES" as const
      : "FOREX" as const,
    direction: mapMT5Type(payload.type),
    entryPrice: payload.openPrice,
    // closePrice = explicit exit price (new EA format); fallback to openPrice for legacy EA payloads
    exitPrice: isClosingDeal ? (payload.closePrice ?? payload.openPrice) : (payload.closePrice ?? null),
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
    status: isClosingDeal ? ("CLOSED" as const) : ("OPEN" as const),
    tradeType: account.type === "DEMO" ? ("DEMO" as const) : ("LIVE" as const),
    notes: payload.comment ?? null,
    externalId,
    brokerMetadata: payload as any,
  };

  // Atomic upsert — the unique index on (externalId, accountId) prevents race-condition duplicates
  const trade = await db.trade.upsert({
    where: { externalId_accountId: { externalId, accountId } },
    update: tradeData,
    create: { ...tradeData, userId: account.userId, accountId },
  });

  // Clean up old EA v1 records that have entry=exit price (bad format from old EA)
  if (isClosingDeal) {
    await db.trade.deleteMany({
      where: {
        userId: account.userId,
        accountId,
        instrument: tradeData.instrument,
        id: { not: trade.id },
        entryPrice: tradeData.entryPrice,
        exitPrice: tradeData.entryPrice,
      },
    });
  }

  // Create copy signals only on first insert (not updates)
  const isNew = trade.openTime.getTime() === openTime.getTime(); // heuristic: same openTime means just created
  if (isNew) {
    const follows = await db.copyFollow.findMany({ where: { followedUserId: account.userId } });
    if (follows.length > 0) {
      await db.copySignal.createMany({
        skipDuplicates: true,
        data: follows.map((f) => ({
          adminId: f.adminId,
          sourceTradeId: trade.id,
          instrument: tradeData.instrument,
          direction: tradeData.direction,
          volume: Number(tradeData.lotSize ?? 0.01),
          openPrice: Number(tradeData.entryPrice),
          stopLoss: tradeData.stopLoss ? Number(tradeData.stopLoss) : null,
          takeProfit: tradeData.takeProfit ? Number(tradeData.takeProfit) : null,
        })),
      });
    }
  }

  return NextResponse.json({ success: true, tradeId: trade.id });
}
