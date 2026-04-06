import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { computeAnalytics } from "@/lib/analytics";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { PnlChart } from "@/components/dashboard/PnlChart";
import { WinRateDonut } from "@/components/dashboard/WinRateDonut";
import { DailyPnlBar } from "@/components/dashboard/DailyPnlBar";
import { InstrumentBreakdown } from "@/components/dashboard/InstrumentBreakdown";
import { RecentTrades } from "@/components/dashboard/RecentTrades";
import { DashboardCalendar } from "@/components/dashboard/DashboardCalendar";
import { toUserDate } from "@/lib/trade-utils";
import { formatCurrency, formatPercent, formatRR } from "@/lib/utils";
import {
  TrendingUp,
  Target,
  Award,
  AlertTriangle,
  BarChart3,
  Clock,
} from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await auth();
  const userId = session!.user!.id;

  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

  const [user, trades] = await Promise.all([
    db.user.findUnique({ where: { id: userId }, select: { timezone: true } }),
    db.trade.findMany({
      where: { userId, openTime: { gte: ninetyDaysAgo } },
      include: {
        account: true,
        tradeTags: { include: { setupTag: true, mistakeTag: true } },
        screenshots: true,
      },
      orderBy: { openTime: "asc" },
    }),
  ]);

  const userTimezone = user?.timezone ?? "UTC";
  const analytics = computeAnalytics(trades as any);

  // Build dayMap for current month only (in user's timezone)
  const nowStr = toUserDate(new Date(), userTimezone);
  const currentMonth = nowStr.slice(0, 7); // "yyyy-MM"
  const dayMap: Record<string, { pnl: number; trades: number }> = {};
  for (const t of trades) {
    if (!t.closeTime || t.status !== "CLOSED") continue;
    const day = toUserDate(t.closeTime, userTimezone);
    if (!day.startsWith(currentMonth)) continue;
    if (!dayMap[day]) dayMap[day] = { pnl: 0, trades: 0 };
    dayMap[day].pnl += Number((t as any).netPnl ?? 0);
    dayMap[day].trades++;
  }

  const pnlHighlight =
    analytics.totalNetPnl > 0 ? "green" : analytics.totalNetPnl < 0 ? "red" : "default";

  const bestSetup =
    Object.values(analytics.bySetupTag).sort((a, b) => b.netPnl - a.netPnl)[0] ?? null;
  const worstMistake = analytics.mistakeFrequency[0] ?? null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-zinc-50">Dashboard</h1>
          <p className="text-sm text-zinc-400">Last 90 days · {analytics.totalTrades} closed trades</p>
        </div>
        <Link
          href="/journal/new"
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 transition-colors"
        >
          + Add Trade
        </Link>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard
          title="Net P&L"
          value={formatCurrency(analytics.totalNetPnl)}
          subtitle={`${analytics.winCount}W · ${analytics.lossCount}L`}
          highlight={pnlHighlight}
          icon={TrendingUp}
        />
        <KpiCard
          title="Win Rate"
          value={`${Math.round(analytics.winRate * 100)}%`}
          subtitle={`${analytics.totalTrades} trades`}
          highlight={analytics.winRate >= 0.5 ? "green" : "default"}
          icon={Target}
        />
        <KpiCard
          title="Profit Factor"
          value={
            analytics.profitFactor === Infinity
              ? "∞"
              : analytics.profitFactor.toFixed(2)
          }
          subtitle={analytics.profitFactor >= 1.5 ? "Strong" : analytics.profitFactor >= 1 ? "Positive" : "Negative"}
          highlight={analytics.profitFactor >= 1.5 ? "green" : analytics.profitFactor >= 1 ? "default" : "red"}
          icon={BarChart3}
        />
        <KpiCard
          title="Avg RR"
          value={formatRR(analytics.avgRR)}
          subtitle={`Expectancy ${formatCurrency(analytics.expectancy)}`}
          icon={Award}
        />
        <KpiCard
          title="Max Drawdown"
          value={formatCurrency(analytics.maxDrawdown)}
          subtitle={`${analytics.maxDrawdownPct.toFixed(1)}% of peak`}
          highlight={analytics.maxDrawdownPct > 20 ? "red" : "default"}
          icon={AlertTriangle}
        />
        <KpiCard
          title="Avg Win"
          value={formatCurrency(analytics.avgWin)}
          subtitle={`Avg Loss ${formatCurrency(analytics.avgLoss)}`}
          highlight="green"
        />
        <KpiCard
          title="Best Setup"
          value={bestSetup?.name ?? "—"}
          subtitle={bestSetup ? formatCurrency(bestSetup.netPnl) : "No setups tagged"}
          highlight={bestSetup && bestSetup.netPnl > 0 ? "blue" : "default"}
        />
        <KpiCard
          title="Top Mistake"
          value={worstMistake?.name ?? "—"}
          subtitle={worstMistake ? `${worstMistake.count}× · ${formatCurrency(worstMistake.pnlImpact)}` : "No mistakes tagged"}
          highlight={worstMistake ? "red" : "default"}
          icon={AlertTriangle}
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Equity Curve */}
        <div className="lg:col-span-2 rounded-xl border border-zinc-800 bg-zinc-900/60 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-zinc-200">Equity Curve</h2>
              <p className="text-xs text-zinc-500">Cumulative P&L over time</p>
            </div>
            <span
              className={`text-sm font-semibold ${analytics.totalNetPnl >= 0 ? "text-emerald-400" : "text-red-400"}`}
            >
              {formatCurrency(analytics.totalNetPnl)}
            </span>
          </div>
          {analytics.equityCurve.length > 0 ? (
            <PnlChart data={analytics.equityCurve} />
          ) : (
            <div className="flex h-[180px] items-center justify-center">
              <p className="text-xs text-zinc-500">Close trades to see your equity curve</p>
            </div>
          )}
        </div>

        {/* Win Rate Donut */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5">
          <h2 className="text-sm font-semibold text-zinc-200 mb-1">Win / Loss Split</h2>
          <p className="text-xs text-zinc-500 mb-4">{analytics.totalTrades} total trades</p>
          <div className="flex justify-center">
            <WinRateDonut
              wins={analytics.winCount}
              losses={analytics.lossCount}
              breakevens={analytics.breakevenCount}
            />
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2 text-center">
            <div>
              <p className="text-xs text-zinc-500">Wins</p>
              <p className="text-sm font-semibold text-emerald-400">{analytics.winCount}</p>
            </div>
            <div>
              <p className="text-xs text-zinc-500">Losses</p>
              <p className="text-sm font-semibold text-red-400">{analytics.lossCount}</p>
            </div>
            <div>
              <p className="text-xs text-zinc-500">BE</p>
              <p className="text-sm font-semibold text-indigo-400">{analytics.breakevenCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Daily PnL + Instrument Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5">
          <h2 className="text-sm font-semibold text-zinc-200 mb-1">Daily P&L</h2>
          <p className="text-xs text-zinc-500 mb-4">Last 30 days</p>
          {analytics.dailyPnl.length > 0 ? (
            <DailyPnlBar data={analytics.dailyPnl} />
          ) : (
            <p className="text-xs text-zinc-500 text-center py-8">No data</p>
          )}
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5">
          <h2 className="text-sm font-semibold text-zinc-200 mb-1">By Instrument</h2>
          <p className="text-xs text-zinc-500 mb-4">Net P&L per instrument</p>
          <InstrumentBreakdown data={analytics.byInstrument} />
        </div>
      </div>

      {/* Monthly Calendar + Session Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-zinc-200">Monthly Overview</h2>
              <p className="text-xs text-zinc-500">Trades this month</p>
            </div>
            <Link
              href="/calendar"
              className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              Full calendar →
            </Link>
          </div>
          <DashboardCalendar dayMap={dayMap} timezone={userTimezone} />
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5">
          <h2 className="text-sm font-semibold text-zinc-200 mb-4">Performance by Session</h2>
          <div className="grid grid-cols-2 gap-3">
            {["ASIAN", "LONDON", "NEW_YORK", "LONDON_NY_OVERLAP"].map((sess) => {
              const s = analytics.bySession[sess];
              const sessionLabels: Record<string, string> = {
                ASIAN: "Asian",
                LONDON: "London",
                NEW_YORK: "New York",
                LONDON_NY_OVERLAP: "London/NY",
              };
              return (
                <div key={sess} className="rounded-lg border border-zinc-700 bg-zinc-800/40 p-4">
                  <p className="text-xs text-zinc-400 mb-2">{sessionLabels[sess]}</p>
                  {s ? (
                    <>
                      <p className={`text-lg font-bold ${s.netPnl >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                        {formatCurrency(s.netPnl)}
                      </p>
                      <p className="text-xs text-zinc-500 mt-1">
                        {s.trades} trades · {Math.round(s.winRate * 100)}% WR
                      </p>
                    </>
                  ) : (
                    <p className="text-sm text-zinc-600">No trades</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recent Trades */}
      <RecentTrades trades={trades.slice(0, 10).reverse() as any} />
    </div>
  );
}
