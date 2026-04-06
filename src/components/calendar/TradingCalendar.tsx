"use client";

import { useState } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameMonth, addMonths, subMonths } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface DayData {
  pnl: number;
  trades: number;
}

interface RawTrade {
  id: string;
  instrument: string;
  direction: string;
  netPnl: any;
  closeTime: any;
}

interface TradingCalendarProps {
  dayMap: Record<string, DayData>;
  rawTrades: RawTrade[];
  timezone: string;
}

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** Convert a UTC Date to "yyyy-MM-dd" in the given IANA timezone (client-side). */
function toUserDateClient(date: Date, timezone: string): string {
  try {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(date);
  } catch {
    return date.toISOString().slice(0, 10);
  }
}

export function TradingCalendar({ dayMap, rawTrades, timezone }: TradingCalendarProps) {
  const [current, setCurrent] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const monthStart = startOfMonth(current);
  const monthEnd = endOfMonth(current);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startPad = getDay(monthStart);

  // Use the same timezone-aware conversion as the server-built dayMap
  const selectedTrades = selectedDay
    ? rawTrades.filter(
        (t) => t.closeTime && toUserDateClient(new Date(t.closeTime), timezone) === selectedDay
      )
    : [];

  const monthPnl = Object.entries(dayMap)
    .filter(([date]) => date.startsWith(format(current, "yyyy-MM")))
    .reduce((sum, [, { pnl }]) => sum + pnl, 0);

  const todayStr = toUserDateClient(new Date(), timezone);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-zinc-50">Trading Calendar</h1>
        <div className="flex items-center gap-2">
          <span className={`text-sm font-semibold ${monthPnl >= 0 ? "text-emerald-400" : "text-red-400"}`}>
            {format(current, "MMMM yyyy")}: {formatCurrency(monthPnl)}
          </span>
          <button
            onClick={() => setCurrent((d) => subMonths(d, 1))}
            className="p-1.5 rounded-lg border border-zinc-700 hover:bg-zinc-800 text-zinc-400"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => setCurrent(new Date())}
            className="px-3 py-1.5 rounded-lg border border-zinc-700 hover:bg-zinc-800 text-xs text-zinc-400"
          >
            Today
          </button>
          <button
            onClick={() => setCurrent((d) => addMonths(d, 1))}
            className="p-1.5 rounded-lg border border-zinc-700 hover:bg-zinc-800 text-zinc-400"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Calendar Grid */}
        <div className="lg:col-span-2 rounded-xl border border-zinc-800 bg-zinc-900/60 overflow-hidden">
          <div className="grid grid-cols-7 border-b border-zinc-800">
            {DAYS.map((d) => (
              <div key={d} className="py-3 text-center text-xs font-medium text-zinc-500">
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {Array.from({ length: startPad }).map((_, i) => (
              <div key={`pad-${i}`} className="min-h-[80px] border-b border-r border-zinc-800/60" />
            ))}
            {days.map((day) => {
              const dateStr = format(day, "yyyy-MM-dd");
              const data = dayMap[dateStr];
              const isSelected = selectedDay === dateStr;
              const isToday = dateStr === todayStr;

              return (
                <button
                  key={dateStr}
                  onClick={() => setSelectedDay(isSelected ? null : dateStr)}
                  className={cn(
                    "min-h-[80px] border-b border-r border-zinc-800/60 p-2 text-left transition-colors",
                    // Win/loss background fills
                    data
                      ? data.pnl > 0
                        ? "bg-emerald-500/10 hover:bg-emerald-500/20"
                        : data.pnl < 0
                        ? "bg-red-500/10 hover:bg-red-500/20"
                        : "hover:bg-zinc-800/40"
                      : "hover:bg-zinc-800/40",
                    // Selected ring overrides
                    isSelected && "ring-2 ring-inset ring-indigo-500/60",
                    !isSameMonth(day, current) && "opacity-30"
                  )}
                >
                  <span
                    className={cn(
                      "flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium mb-1",
                      isToday ? "bg-indigo-600 text-white" : "text-zinc-400"
                    )}
                  >
                    {format(day, "d")}
                  </span>
                  {data && (
                    <>
                      <div
                        className={cn(
                          "text-xs font-semibold",
                          data.pnl > 0 ? "text-emerald-400" : data.pnl < 0 ? "text-red-400" : "text-zinc-400"
                        )}
                      >
                        {data.pnl > 0 ? "+" : ""}{formatCurrency(data.pnl)}
                      </div>
                      <div className="text-[10px] text-zinc-500 mt-0.5">{data.trades} trade{data.trades !== 1 ? "s" : ""}</div>
                    </>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Day Detail Panel */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5">
          {selectedDay ? (
            <>
              <h2 className="text-sm font-semibold text-zinc-200 mb-1">
                {format(new Date(selectedDay + "T12:00:00"), "MMMM d, yyyy")}
              </h2>
              <p className="text-xs text-zinc-500 mb-4">
                {selectedTrades.length} trade{selectedTrades.length !== 1 ? "s" : ""}{" "}
                {dayMap[selectedDay] && (
                  <>
                    ·{" "}
                    <span className={dayMap[selectedDay].pnl >= 0 ? "text-emerald-400" : "text-red-400"}>
                      {formatCurrency(dayMap[selectedDay].pnl)}
                    </span>
                  </>
                )}
              </p>
              {selectedTrades.length > 0 ? (
                <div className="space-y-2">
                  {selectedTrades.map((t) => {
                    const pnl = Number(t.netPnl ?? 0);
                    return (
                      <a
                        key={t.id}
                        href={`/journal/${t.id}`}
                        className="flex items-center justify-between rounded-lg border border-zinc-700 px-3 py-2.5 hover:border-indigo-500/30 transition-colors"
                      >
                        <div>
                          <p className="text-sm font-medium text-zinc-200">{t.instrument}</p>
                          <p className="text-xs text-zinc-500">{t.direction}</p>
                        </div>
                        <p className={`text-sm font-semibold ${pnl > 0 ? "text-emerald-400" : pnl < 0 ? "text-red-400" : "text-zinc-400"}`}>
                          {formatCurrency(pnl)}
                        </p>
                      </a>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-zinc-600">No trade details available.</p>
              )}
            </>
          ) : (
            <div className="flex h-full min-h-[200px] items-center justify-center">
              <p className="text-xs text-zinc-500 text-center">Click a day to see trades</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
