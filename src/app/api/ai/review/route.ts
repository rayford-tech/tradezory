import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { computeAnalytics } from "@/lib/analytics";
import { anthropic } from "@/lib/ai";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { periodStart, periodEnd, type } = await req.json();
  if (!periodStart || !periodEnd) return NextResponse.json({ error: "Period required" }, { status: 400 });

  const trades = await db.trade.findMany({
    where: {
      userId: session.user.id,
      openTime: { gte: new Date(periodStart), lte: new Date(periodEnd) },
      status: "CLOSED",
    },
    include: { tradeTags: { include: { setupTag: true, mistakeTag: true } } },
  });

  if (trades.length === 0) {
    return NextResponse.json({ error: "No closed trades in this period" }, { status: 400 });
  }

  const a = computeAnalytics(trades as any);
  const sortedByPnl = [...trades].sort((a, b) => Number(b.netPnl ?? 0) - Number(a.netPnl ?? 0));
  const best = sortedByPnl[0];
  const worst = sortedByPnl[sortedByPnl.length - 1];

  const context = `
${type === "WEEKLY" ? "Weekly" : "Monthly"} trading period review:
- Total trades: ${a.totalTrades}
- Net P&L: $${a.totalNetPnl.toFixed(2)}
- Win rate: ${(a.winRate * 100).toFixed(1)}%
- Profit factor: ${a.profitFactor === Infinity ? "∞" : a.profitFactor.toFixed(2)}
- Avg RR: ${a.avgRR.toFixed(2)}
- Best trade: ${best.instrument} ${best.direction} $${Number(best.netPnl ?? 0).toFixed(2)}
- Worst trade: ${worst.instrument} ${worst.direction} $${Number(worst.netPnl ?? 0).toFixed(2)}
${a.avgExecutionScore > 0 ? `- Avg execution score: ${a.avgExecutionScore.toFixed(1)}/10` : ""}
${a.mistakeFrequency.length > 0 ? `- Top mistakes: ${a.mistakeFrequency.slice(0, 3).map((m) => `${m.name} (${m.count}×)`).join(", ")}` : ""}
`.trim();

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 600,
    system:
      'You are a trading journal assistant. Generate a trading period review based on the data. Return valid JSON only (no markdown fences) with exactly these 4 string keys: "summary" (2-3 sentences on overall performance), "improvements" (2-3 specific areas to improve, bullet style with - prefix), "lessons" (2-3 key lessons learned, bullet style), "goals" (2-3 specific goals for next period, bullet style). Base everything on the actual data.',
    messages: [{ role: "user", content: context }],
  });

  const raw = (message.content[0] as any).text as string;
  try {
    const parsed = JSON.parse(raw);
    return NextResponse.json(parsed);
  } catch {
    // Try to extract JSON from the response
    const match = raw.match(/\{[\s\S]*\}/);
    if (match) {
      return NextResponse.json(JSON.parse(match[0]));
    }
    return NextResponse.json({ error: "Failed to parse AI response" }, { status: 500 });
  }
}
