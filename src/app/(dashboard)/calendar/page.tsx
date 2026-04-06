import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { TradingCalendar } from "@/components/calendar/TradingCalendar";
import { startOfMonth, endOfMonth, subMonths } from "date-fns";
import { toUserDate } from "@/lib/trade-utils";

export const dynamic = "force-dynamic";

export default async function CalendarPage() {
  const session = await auth();
  const userId = session!.user!.id;

  const now = new Date();
  const from = subMonths(startOfMonth(now), 2);
  const to = endOfMonth(now);

  const [user, trades] = await Promise.all([
    db.user.findUnique({ where: { id: userId }, select: { timezone: true } }),
    db.trade.findMany({
      where: {
        userId,
        status: "CLOSED",
        closeTime: { gte: from, lte: to },
      },
      select: {
        id: true,
        instrument: true,
        direction: true,
        netPnl: true,
        closeTime: true,
        status: true,
      },
      orderBy: { closeTime: "asc" },
    }),
  ]);

  const userTimezone = user?.timezone ?? "UTC";

  // Build day map using the user's local trading date, not UTC date
  const dayMap: Record<string, { pnl: number; trades: number }> = {};
  for (const t of trades) {
    if (!t.closeTime) continue;
    const day = toUserDate(t.closeTime, userTimezone);
    if (!dayMap[day]) dayMap[day] = { pnl: 0, trades: 0 };
    dayMap[day].pnl += Number(t.netPnl ?? 0);
    dayMap[day].trades++;
  }

  return <TradingCalendar dayMap={dayMap} rawTrades={trades as any} />;
}
