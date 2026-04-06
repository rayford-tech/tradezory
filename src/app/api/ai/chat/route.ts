import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { computeAnalytics } from "@/lib/analytics";
import { anthropic } from "@/lib/ai";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { messages } = await req.json();
  if (!Array.isArray(messages)) return NextResponse.json({ error: "messages required" }, { status: 400 });

  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
  const trades = await db.trade.findMany({
    where: { userId: session.user.id, openTime: { gte: ninetyDaysAgo } },
    include: { tradeTags: { include: { setupTag: true, mistakeTag: true } } },
  });

  const a = computeAnalytics(trades as any);
  const bestSession = Object.values(a.bySession).sort((a, b) => b.netPnl - a.netPnl)[0];
  const topInstruments = Object.values(a.byInstrument)
    .sort((a, b) => b.netPnl - a.netPnl)
    .slice(0, 3)
    .map((i) => `${i.instrument} ($${i.netPnl.toFixed(0)})`)
    .join(", ");

  const systemContext = `You are an expert trading coach and analyst embedded in TradeForge, a trading journal app. You have full access to this trader's data from the last 90 days.

Trader stats:
- Closed trades: ${a.totalTrades}
- Net P&L: $${a.totalNetPnl.toFixed(2)}
- Win rate: ${(a.winRate * 100).toFixed(1)}%
- Profit factor: ${a.profitFactor === Infinity ? "∞" : a.profitFactor.toFixed(2)}
- Avg RR: ${a.avgRR.toFixed(2)}, Expectancy: $${a.expectancy.toFixed(2)}/trade
- Avg win: $${a.avgWin.toFixed(2)}, Avg loss: $${a.avgLoss.toFixed(2)}
- Max drawdown: $${a.maxDrawdown.toFixed(2)} (${a.maxDrawdownPct.toFixed(1)}%)
- Best session: ${bestSession ? bestSession.session + " ($" + bestSession.netPnl.toFixed(0) + ")" : "N/A"}
- Top instruments: ${topInstruments || "N/A"}
${a.mistakeFrequency.length > 0 ? `- Recurring mistakes: ${a.mistakeFrequency.slice(0, 3).map((m) => `${m.name} (${m.count}×)`).join(", ")}` : ""}

Be concise, data-driven, and actionable. Use the trader's actual numbers when relevant.`;

  const stream = anthropic.messages.stream({
    model: "claude-sonnet-4-6",
    max_tokens: 500,
    system: systemContext,
    messages: messages.map((m: { role: string; content: string }) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
  });

  const readable = new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        if (
          chunk.type === "content_block_delta" &&
          chunk.delta.type === "text_delta"
        ) {
          controller.enqueue(new TextEncoder().encode(chunk.delta.text));
        }
      }
      controller.close();
    },
  });

  return new NextResponse(readable, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
