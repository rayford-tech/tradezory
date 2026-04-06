import type { TradingSession } from "@prisma/client";

export function computeHoldingMinutes(openTime: string, closeTime: string): number {
  const open = new Date(openTime).getTime();
  const close = new Date(closeTime).getTime();
  return Math.round((close - open) / 60000);
}

/**
 * Infer trading session from UTC open time.
 * Asian: 00:00–08:00 UTC
 * London: 08:00–13:00 UTC
 * London/NY Overlap: 13:00–16:00 UTC
 * New York: 16:00–22:00 UTC
 */
export function inferSession(openTime: string): TradingSession {
  const hour = new Date(openTime).getUTCHours();
  if (hour >= 0 && hour < 8) return "ASIAN";
  if (hour >= 8 && hour < 13) return "LONDON";
  if (hour >= 13 && hour < 16) return "LONDON_NY_OVERLAP";
  return "NEW_YORK";
}

/**
 * Convert a UTC Date to a "yyyy-MM-dd" string in the user's IANA timezone.
 * Uses Intl.DateTimeFormat — no additional dependencies required.
 *
 * Example: a trade closed at 00:30 UTC Tuesday becomes "Monday"
 * when the user's timezone is "America/Chicago" (CST = UTC-6).
 *
 * Falls back to UTC if the timezone string is invalid.
 */
export function toUserDate(date: Date, timezone: string): string {
  try {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(date);
    const year  = parts.find((p) => p.type === "year")!.value;
    const month = parts.find((p) => p.type === "month")!.value;
    const day   = parts.find((p) => p.type === "day")!.value;
    return `${year}-${month}-${day}`;
  } catch {
    return date.toISOString().slice(0, 10);
  }
}
