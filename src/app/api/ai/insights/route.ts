import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { computeAnalytics } from "@/lib/analytics";
import { callAI } from "@/lib/ai";

export const dynamic = "force-dynamic";

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = session.user.id;

  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
  const trades = await db.trade.findMany({
    where: { userId, openTime: { gte: ninetyDaysAgo } },
    include: {
      tradeTags: { include: { setupTag: true, mistakeTag: true } },
    },
  });

  const a = computeAnalytics(trades as any);

  const byDow = Object.values(a.byDayOfWeek) as { day: string; netPnl: number; trades: number; winRate: number }[];
  const bestDow = byDow.filter((d) => d.trades > 0).sort((a, b) => b.netPnl - a.netPnl)[0];
  const worstDow = byDow.filter((d) => d.trades > 0).sort((a, b) => a.netPnl - b.netPnl)[0];
  const bestInstrument = Object.values(a.byInstrument).sort((a, b) => b.netPnl - a.netPnl)[0];
  const worstInstrument = Object.values(a.byInstrument).sort((a, b) => a.netPnl - b.netPnl)[0];
  const topMistake = a.mistakeFrequency[0];

  const context = `
Trader statistics (last 90 days):
- Total closed trades: ${a.totalTrades}
- Net P&L: $${a.totalNetPnl.toFixed(2)}
- Win rate: ${(a.winRate * 100).toFixed(1)}%
- Profit factor: ${a.profitFactor === Infinity ? "∞" : a.profitFactor.toFixed(2)}
- Avg win: $${a.avgWin.toFixed(2)}, Avg loss: $${a.avgLoss.toFixed(2)}
- Avg RR: ${a.avgRR.toFixed(2)}
- Expectancy: $${a.expectancy.toFixed(2)} per trade
- Max consecutive losses: ${a.consecutiveLosses}
- Max drawdown: $${a.maxDrawdown.toFixed(2)} (${a.maxDrawdownPct.toFixed(1)}%)
${bestDow ? `- Best day of week: ${bestDow.day} ($${bestDow.netPnl.toFixed(2)}, ${(bestDow.winRate * 100).toFixed(0)}% WR)` : ""}
${worstDow ? `- Worst day of week: ${worstDow.day} ($${worstDow.netPnl.toFixed(2)}, ${(worstDow.winRate * 100).toFixed(0)}% WR)` : ""}
${bestInstrument ? `- Best instrument: ${bestInstrument.instrument} ($${bestInstrument.netPnl.toFixed(2)})` : ""}
${worstInstrument && worstInstrument.instrument !== bestInstrument?.instrument ? `- Worst instrument: ${worstInstrument.instrument} ($${worstInstrument.netPnl.toFixed(2)})` : ""}
${topMistake ? `- Most frequent mistake: ${topMistake.name} (${topMistake.count}×, P&L impact $${topMistake.pnlImpact.toFixed(2)})` : "- No mistake tags recorded"}
- Avg execution score: ${a.avgExecutionScore > 0 ? a.avgExecutionScore.toFixed(1) + "/10" : "not tracked"}
`.trim();

  const raw = await callAI({
    system:
      "You are a professional trading coach reviewing a trader's statistics. Generate exactly 4 bullet-point insights (one sentence each). Be specific with numbers. Identify patterns, risks, and opportunities. Be direct and actionable. Return only the 4 bullets starting with '•', no intro text, no extra lines.",
    user: context,
    tier: "smart",
    maxTokens: 400,
  });
  const insights = raw
    .split("\n")
    .map((l) => l.replace(/^[•\-\*]\s*/, "").trim())
    .filter(Boolean)
    .slice(0, 4);

  return NextResponse.json({ insights });
}
