import type { TradeWithRelations, AnalyticsResult } from "@/types";
import { format, parseISO } from "date-fns";

function safeNum(val: unknown): number {
  const n = Number(val);
  return isNaN(n) ? 0 : n;
}

export function computeAnalytics(trades: TradeWithRelations[]): AnalyticsResult {
  const closed = trades.filter((t) => t.status === "CLOSED" && t.closeTime);

  const wins = closed.filter((t) => safeNum(t.netPnl) > 0);
  const losses = closed.filter((t) => safeNum(t.netPnl) < 0);
  const breakevens = closed.filter((t) => safeNum(t.netPnl) === 0);

  const winCount = wins.length;
  const lossCount = losses.length;
  const breakevenCount = breakevens.length;
  const totalTrades = closed.length;

  const totalNetPnl = closed.reduce((s, t) => s + safeNum(t.netPnl), 0);
  const grossProfit = wins.reduce((s, t) => s + safeNum(t.netPnl), 0);
  const grossLoss = Math.abs(losses.reduce((s, t) => s + safeNum(t.netPnl), 0));

  const avgWin = winCount > 0 ? grossProfit / winCount : 0;
  const avgLoss = lossCount > 0 ? grossLoss / lossCount : 0;
  const avgNetPnl = totalTrades > 0 ? totalNetPnl / totalTrades : 0;

  const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? Infinity : 0;
  const winRate = totalTrades > 0 ? winCount / totalTrades : 0;
  const lossRate = totalTrades > 0 ? lossCount / totalTrades : 0;
  const breakevenRate = totalTrades > 0 ? breakevenCount / totalTrades : 0;

  const rrValues = closed.filter((t) => t.rrRatio != null).map((t) => safeNum(t.rrRatio));
  const avgRR = rrValues.length > 0 ? rrValues.reduce((a, b) => a + b, 0) / rrValues.length : 0;

  const expectancy = winRate * avgWin - lossRate * avgLoss;

  const holdingTimes = closed.filter((t) => t.holdingMinutes != null).map((t) => t.holdingMinutes!);
  const avgHoldingMinutes = holdingTimes.length > 0 ? holdingTimes.reduce((a, b) => a + b, 0) / holdingTimes.length : 0;

  // Execution scores
  const execScores = closed.filter((t) => t.executionScore != null).map((t) => t.executionScore!);
  const discScores = closed.filter((t) => t.disciplineScore != null).map((t) => t.disciplineScore!);
  const confScores = closed.filter((t) => t.confidenceScore != null).map((t) => t.confidenceScore!);
  const avgExec = execScores.length > 0 ? execScores.reduce((a, b) => a + b, 0) / execScores.length : 0;
  const avgDisc = discScores.length > 0 ? discScores.reduce((a, b) => a + b, 0) / discScores.length : 0;
  const avgConf = confScores.length > 0 ? confScores.reduce((a, b) => a + b, 0) / confScores.length : 0;

  // Consecutive wins/losses
  let maxConsecWins = 0;
  let maxConsecLosses = 0;
  let curWins = 0;
  let curLosses = 0;
  for (const t of closed) {
    const pnl = safeNum(t.netPnl);
    if (pnl > 0) {
      curWins++;
      curLosses = 0;
      maxConsecWins = Math.max(maxConsecWins, curWins);
    } else if (pnl < 0) {
      curLosses++;
      curWins = 0;
      maxConsecLosses = Math.max(maxConsecLosses, curLosses);
    } else {
      curWins = 0;
      curLosses = 0;
    }
  }

  // Max drawdown
  let peak = 0;
  let equity = 0;
  let maxDrawdown = 0;
  const equityCurve: { date: string; equity: number; drawdown: number }[] = [];
  const sortedByTime = [...closed].sort(
    (a, b) => new Date(a.closeTime!).getTime() - new Date(b.closeTime!).getTime()
  );

  for (const t of sortedByTime) {
    equity += safeNum(t.netPnl);
    if (equity > peak) peak = equity;
    const dd = peak - equity;
    if (dd > maxDrawdown) maxDrawdown = dd;
    equityCurve.push({
      date: format(new Date(t.closeTime!), "yyyy-MM-dd"),
      equity: Math.round(equity * 100) / 100,
      drawdown: Math.round(-dd * 100) / 100,
    });
  }
  const maxDrawdownPct = peak > 0 ? (maxDrawdown / peak) * 100 : 0;

  // Daily PnL
  const dailyMap = new Map<string, { pnl: number; trades: number }>();
  for (const t of closed) {
    const day = format(new Date(t.closeTime!), "yyyy-MM-dd");
    const existing = dailyMap.get(day) ?? { pnl: 0, trades: 0 };
    dailyMap.set(day, { pnl: existing.pnl + safeNum(t.netPnl), trades: existing.trades + 1 });
  }
  const dailyPnl = [...dailyMap.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, { pnl, trades }]) => ({ date, pnl: Math.round(pnl * 100) / 100, trades }));

  const bestDay = dailyPnl.length > 0 ? dailyPnl.reduce((a, b) => (b.pnl > a.pnl ? b : a)) : null;
  const worstDay = dailyPnl.length > 0 ? dailyPnl.reduce((a, b) => (b.pnl < a.pnl ? b : a)) : null;

  // By instrument
  const byInstrument: Record<string, ReturnType<typeof buildInstrumentStats>> = {};
  for (const t of closed) {
    const key = t.instrument;
    if (!byInstrument[key]) {
      byInstrument[key] = { instrument: key, trades: 0, wins: 0, losses: 0, netPnl: 0, winRate: 0, avgRR: 0, rrSum: 0, rrCount: 0 };
    }
    const s = byInstrument[key];
    s.trades++;
    s.netPnl += safeNum(t.netPnl);
    if (safeNum(t.netPnl) > 0) s.wins++;
    else if (safeNum(t.netPnl) < 0) s.losses++;
    if (t.rrRatio != null) { s.rrSum += safeNum(t.rrRatio); s.rrCount++; }
  }
  for (const s of Object.values(byInstrument)) {
    s.winRate = s.trades > 0 ? s.wins / s.trades : 0;
    s.avgRR = s.rrCount > 0 ? s.rrSum / s.rrCount : 0;
    s.netPnl = Math.round(s.netPnl * 100) / 100;
    delete (s as any).rrSum;
    delete (s as any).rrCount;
  }

  // By session
  const bySession: Record<string, any> = {};
  for (const t of closed) {
    const key = t.session ?? "UNKNOWN";
    if (!bySession[key]) bySession[key] = { session: key, trades: 0, wins: 0, losses: 0, netPnl: 0, winRate: 0 };
    const s = bySession[key];
    s.trades++;
    s.netPnl += safeNum(t.netPnl);
    if (safeNum(t.netPnl) > 0) s.wins++;
    else if (safeNum(t.netPnl) < 0) s.losses++;
  }
  for (const s of Object.values(bySession)) {
    s.winRate = s.trades > 0 ? s.wins / s.trades : 0;
    s.netPnl = Math.round(s.netPnl * 100) / 100;
  }

  // By setup tag
  const bySetupTag: Record<string, any> = {};
  for (const t of closed) {
    for (const tt of t.tradeTags) {
      if (!tt.setupTag) continue;
      const key = tt.setupTag.name;
      if (!bySetupTag[key]) bySetupTag[key] = { name: key, trades: 0, wins: 0, losses: 0, netPnl: 0, winRate: 0, avgRR: 0, rrSum: 0, rrCount: 0 };
      const s = bySetupTag[key];
      s.trades++;
      s.netPnl += safeNum(t.netPnl);
      if (safeNum(t.netPnl) > 0) s.wins++;
      else if (safeNum(t.netPnl) < 0) s.losses++;
      if (t.rrRatio != null) { s.rrSum += safeNum(t.rrRatio); s.rrCount++; }
    }
  }
  for (const s of Object.values(bySetupTag)) {
    s.winRate = s.trades > 0 ? s.wins / s.trades : 0;
    s.avgRR = s.rrCount > 0 ? s.rrSum / s.rrCount : 0;
    s.netPnl = Math.round(s.netPnl * 100) / 100;
    delete s.rrSum; delete s.rrCount;
  }

  // By mistake tag
  const byMistakeTag: Record<string, any> = {};
  const mistakeFrequency: { name: string; count: number; pnlImpact: number }[] = [];
  for (const t of closed) {
    for (const tt of t.tradeTags) {
      if (!tt.mistakeTag) continue;
      const key = tt.mistakeTag.name;
      if (!byMistakeTag[key]) byMistakeTag[key] = { name: key, count: 0, pnlImpact: 0 };
      byMistakeTag[key].count++;
      byMistakeTag[key].pnlImpact += safeNum(t.netPnl);
    }
  }
  for (const [name, s] of Object.entries(byMistakeTag)) {
    mistakeFrequency.push({ name, count: s.count, pnlImpact: Math.round(s.pnlImpact * 100) / 100 });
  }
  mistakeFrequency.sort((a, b) => b.count - a.count);

  // By day of week
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const byDayOfWeek: Record<string, any> = {};
  for (const t of closed) {
    const day = days[new Date(t.closeTime!).getDay()];
    if (!byDayOfWeek[day]) byDayOfWeek[day] = { day, trades: 0, wins: 0, losses: 0, netPnl: 0, winRate: 0 };
    const s = byDayOfWeek[day];
    s.trades++;
    s.netPnl += safeNum(t.netPnl);
    if (safeNum(t.netPnl) > 0) s.wins++;
    else if (safeNum(t.netPnl) < 0) s.losses++;
  }
  for (const s of Object.values(byDayOfWeek)) {
    s.winRate = s.trades > 0 ? s.wins / s.trades : 0;
    s.netPnl = Math.round(s.netPnl * 100) / 100;
  }

  return {
    totalTrades,
    winCount,
    lossCount,
    breakevenCount,
    winRate,
    lossRate,
    breakevenRate,
    totalNetPnl: Math.round(totalNetPnl * 100) / 100,
    grossProfit: Math.round(grossProfit * 100) / 100,
    grossLoss: Math.round(grossLoss * 100) / 100,
    avgWin: Math.round(avgWin * 100) / 100,
    avgLoss: Math.round(avgLoss * 100) / 100,
    avgNetPnl: Math.round(avgNetPnl * 100) / 100,
    profitFactor: Math.round(profitFactor * 100) / 100,
    expectancy: Math.round(expectancy * 100) / 100,
    avgRR: Math.round(avgRR * 100) / 100,
    maxDrawdown: Math.round(maxDrawdown * 100) / 100,
    maxDrawdownPct: Math.round(maxDrawdownPct * 100) / 100,
    avgHoldingMinutes: Math.round(avgHoldingMinutes),
    consecutiveWins: maxConsecWins,
    consecutiveLosses: maxConsecLosses,
    avgExecutionScore: Math.round(avgExec * 10) / 10,
    avgDisciplineScore: Math.round(avgDisc * 10) / 10,
    avgConfidenceScore: Math.round(avgConf * 10) / 10,
    byInstrument,
    bySession,
    bySetupTag,
    byMistakeTag,
    byDayOfWeek,
    equityCurve,
    dailyPnl,
    mistakeFrequency,
    bestDay: bestDay ? { date: bestDay.date, pnl: bestDay.pnl } : null,
    worstDay: worstDay ? { date: worstDay.date, pnl: worstDay.pnl } : null,
  };
}

function buildInstrumentStats() {
  return { instrument: "", trades: 0, wins: 0, losses: 0, netPnl: 0, winRate: 0, avgRR: 0, rrSum: 0, rrCount: 0 };
}
