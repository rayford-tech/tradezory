import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { callAI } from "@/lib/ai";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { tradeId } = await req.json();
  if (!tradeId) return NextResponse.json({ error: "tradeId required" }, { status: 400 });

  const trade = await db.trade.findUnique({
    where: { id: tradeId, userId: session.user.id },
    include: { tradeTags: { include: { setupTag: true, mistakeTag: true } } },
  });
  if (!trade) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const setups = trade.tradeTags.filter((t) => t.setupTag).map((t) => t.setupTag!.name);
  const mistakes = trade.tradeTags.filter((t) => t.mistakeTag).map((t) => t.mistakeTag!.name);
  const pnl = Number(trade.netPnl ?? 0);

  const context = `
Trade summary:
- Instrument: ${trade.instrument} (${trade.direction})
- Result: ${trade.status === "CLOSED" ? (pnl > 0 ? "WIN" : pnl < 0 ? "LOSS" : "BREAKEVEN") : "OPEN"}, P&L: $${pnl.toFixed(2)}
- RR Ratio: ${trade.rrRatio ? Number(trade.rrRatio).toFixed(2) + "R" : "not set"}
- Session: ${trade.session ?? "not recorded"}
${trade.executionScore != null ? `- Execution score: ${trade.executionScore}/10` : ""}
${trade.disciplineScore != null ? `- Discipline score: ${trade.disciplineScore}/10` : ""}
${trade.confidenceScore != null ? `- Confidence score: ${trade.confidenceScore}/10` : ""}
${trade.emotionBefore ? `- Emotion before: ${trade.emotionBefore}` : ""}
${trade.emotionAfter ? `- Emotion after: ${trade.emotionAfter}` : ""}
${trade.preTradeReasoning ? `- Pre-trade reasoning: ${trade.preTradeReasoning}` : ""}
${trade.postTradeReview ? `- Post-trade review: ${trade.postTradeReview}` : ""}
${setups.length > 0 ? `- Setup tags: ${setups.join(", ")}` : ""}
${mistakes.length > 0 ? `- Mistake tags: ${mistakes.join(", ")}` : ""}
`.trim();

  try {
    const feedback = await callAI({
      system:
        "You are a concise trading coach. Output EXACTLY 3 lines. Each line starts with '1.', '2.', or '3.' followed by one observation (max 2 sentences). Focus on execution quality, psychology, and process — not just outcome. Do NOT add any intro, header, or text before '1.' or after '3.'.",
      user: context,
      tier: "fast",
      maxTokens: 600,
    });
    return NextResponse.json({ feedback });
  } catch (err: any) {
    console.error("AI coach error:", err?.message ?? err);
    return NextResponse.json(
      { error: err?.message ?? "AI unavailable" },
      { status: 503 }
    );
  }
}
