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
}

interface DashboardCalendarProps {
  dayMap: Record<string, DayData>;
  timezone: string;
}

const DAY_HEADERS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

export function DashboardCalendar({ dayMap, timezone }: DashboardCalendarProps) {
  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startPad = getDay(monthStart);

  // Compute "today" in the user's timezone — must match the server-side dayMap keys
  const todayStr = (() => {
    try {
      return new Intl.DateTimeFormat("en-CA", {
        timeZone: timezone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).format(now);
    } catch {
      return now.toISOString().slice(0, 10);
    }
  })();

  return (
    <div>
      {/* Day-of-week headers */}
      <div className="grid grid-cols-7 mb-1">
        {DAY_HEADERS.map((d) => (
          <div key={d} className="text-center text-[10px] font-medium text-zinc-600 py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-0.5">
        {/* Leading empty cells */}
        {Array.from({ length: startPad }).map((_, i) => (
          <div key={`pad-${i}`} className="aspect-square" />
        ))}

        {/* Day cells */}
        {days.map((day) => {
          const dateStr = format(day, "yyyy-MM-dd");
          const data = dayMap[dateStr];
          const isToday = dateStr === todayStr;

          return (
            <div
              key={dateStr}
              className={cn(
                "aspect-square rounded-md flex flex-col items-center justify-center p-0.5",
                data
                  ? data.pnl > 0
                    ? "bg-emerald-500/20 border border-emerald-500/30"
                    : data.pnl < 0
                    ? "bg-red-500/20 border border-red-500/30"
                    : "bg-zinc-700/40 border border-zinc-700"
                  : "bg-zinc-800/30 border border-zinc-800/60",
                isToday && "ring-1 ring-indigo-500 ring-offset-1 ring-offset-zinc-900"
              )}
            >
              <span
                className={cn(
                  "text-[9px] font-semibold leading-none",
                  isToday ? "text-indigo-400" : "text-zinc-500"
                )}
              >
                {format(day, "d")}
              </span>
              {data && (
                <>
                  <span
                    className={cn(
                      "text-[8px] font-bold leading-none mt-0.5 truncate w-full text-center",
                      data.pnl > 0 ? "text-emerald-400" : "text-red-400"
                    )}
                  >
                    {data.pnl > 0 ? "+" : ""}
                    {formatCurrency(data.pnl).replace("$", "")}
                  </span>
                  <span className="text-[7px] text-zinc-600 leading-none">
                    {data.trades}t
                  </span>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
