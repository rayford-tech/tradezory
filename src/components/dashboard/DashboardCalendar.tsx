"use client";

import {
  eachDayOfInterval,
  endOfMonth,
  format,
  getDay,
  startOfMonth,
} from "date-fns";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface DayData {
  pnl: number;
  trades: number;
  wins: number;
}

interface DashboardCalendarProps {
  dayMap: Record<string, DayData>;
  timezone: string;
}

const DAY_HEADERS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

/** Get "today" in the user's IANA timezone. */
function todayInTz(timezone: string): string {
  try {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());
  } catch {
    return new Date().toISOString().slice(0, 10);
  }
}

export function DashboardCalendar({ dayMap, timezone }: DashboardCalendarProps) {
  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startPad = getDay(monthStart);
  const todayStr = todayInTz(timezone);

  return (
    <div>
      {/* Day-of-week headers */}
      <div className="grid grid-cols-7 mb-1">
        {DAY_HEADERS.map((d) => (
          <div key={d} className="text-center text-[11px] font-medium text-zinc-600 py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-0.5">
        {/* Leading empty cells */}
        {Array.from({ length: startPad }).map((_, i) => (
          <div key={`pad-${i}`} className="h-14" />
        ))}

        {/* Day cells */}
        {days.map((day) => {
          const dateStr = format(day, "yyyy-MM-dd");
          const data = dayMap[dateStr];
          const isToday = dateStr === todayStr;
          const winRate = data && data.trades > 0
            ? Math.round((data.wins / data.trades) * 100)
            : null;

          const cell = (
            <div
              key={dateStr}
              className={cn(
                "h-14 rounded-md flex flex-col px-1.5 py-1 relative transition-all",
                data
                  ? data.pnl > 0
                    ? "bg-emerald-500/20 border border-emerald-500/30 hover:bg-emerald-500/30 cursor-pointer"
                    : data.pnl < 0
                    ? "bg-red-500/20 border border-red-500/30 hover:bg-red-500/30 cursor-pointer"
                    : "bg-zinc-700/40 border border-zinc-700 hover:bg-zinc-700/60 cursor-pointer"
                  : "bg-zinc-800/30 border border-zinc-800/60",
                isToday && "ring-1 ring-indigo-500 ring-offset-1 ring-offset-zinc-900"
              )}
            >
              {/* Date number — top right */}
              <span
                className={cn(
                  "text-[11px] font-semibold self-end leading-none",
                  isToday ? "text-indigo-400" : "text-zinc-500"
                )}
              >
                {format(day, "d")}
              </span>

              {/* P&L + stats */}
              {data ? (
                <div className="mt-auto">
                  <p className={cn(
                    "text-xs font-bold leading-tight",
                    data.pnl > 0 ? "text-emerald-300" : "text-red-400"
                  )}>
                    {data.pnl > 0 ? "+" : ""}{formatCurrency(data.pnl)}
                  </p>
                  <p className="text-[10px] text-zinc-500 leading-none mt-0.5">
                    {data.trades}t{winRate !== null ? ` · ${winRate}%` : ""}
                  </p>
                </div>
              ) : null}
            </div>
          );

          // Wrap in a link if there's data for the day
          if (data) {
            return (
              <a key={dateStr} href={`/calendar`} title={`${dateStr}: ${formatCurrency(data.pnl)} · ${data.trades} trades`}>
                {cell}
              </a>
            );
          }

          return <div key={dateStr}>{cell}</div>;
        })}
      </div>
    </div>
  );
}
