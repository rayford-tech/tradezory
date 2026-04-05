import Papa from "papaparse";
import type { AssetClass, Direction, TradingSession } from "@prisma/client";

export interface CsvRow {
  [key: string]: string;
}

export interface ParsedTrade {
  instrument: string;
  assetClass: AssetClass;
  direction: Direction;
  entryPrice: number;
  exitPrice?: number | null;
  stopLoss?: number | null;
  takeProfit?: number | null;
  lotSize?: number | null;
  grossPnl?: number | null;
  netPnl?: number | null;
  commission?: number | null;
  swap?: number | null;
  openTime: string;
  closeTime?: string | null;
  session?: TradingSession | null;
  status: "OPEN" | "CLOSED";
  notes?: string | null;
  externalId?: string | null;
  brokerMetadata?: Record<string, string>;
}

export interface ColumnMapping {
  instrument?: string;
  direction?: string;
  entryPrice?: string;
  exitPrice?: string;
  stopLoss?: string;
  takeProfit?: string;
  lotSize?: string;
  grossPnl?: string;
  netPnl?: string;
  commission?: string;
  swap?: string;
  openTime?: string;
  closeTime?: string;
  symbol?: string;
  externalId?: string;
  notes?: string;
}

// Pre-built MT5 column mapping templates
export const MT5_COLUMN_TEMPLATE: ColumnMapping = {
  externalId: "Ticket",
  instrument: "Symbol",
  direction: "Type",
  lotSize: "Volume",
  entryPrice: "Open Price",
  stopLoss: "S / L",
  takeProfit: "T / P",
  openTime: "Open Time",
  closeTime: "Close Time",
  exitPrice: "Close Price",
  commission: "Commission",
  swap: "Swap",
  grossPnl: "Profit",
  notes: "Comment",
};

export const GENERIC_TEMPLATE: ColumnMapping = {
  instrument: "symbol",
  direction: "side",
  entryPrice: "entry_price",
  exitPrice: "exit_price",
  openTime: "open_time",
  closeTime: "close_time",
  netPnl: "pnl",
};

function parseNum(v: string | undefined): number | null {
  if (!v) return null;
  const n = parseFloat(v.replace(/[,$\s]/g, ""));
  return isNaN(n) ? null : n;
}

function parseDirection(v: string): Direction {
  const lower = v.toLowerCase();
  if (lower.includes("buy") || lower === "long" || lower === "b") return "BUY";
  return "SELL";
}

function parseDateTime(v: string): string | null {
  if (!v?.trim()) return null;
  const d = new Date(v.trim());
  if (!isNaN(d.getTime())) return d.toISOString();
  // Try DD.MM.YYYY HH:MM:SS (MT5 format)
  const mt5 = v.match(/(\d{2})\.(\d{2})\.(\d{4})\s+(\d{2}):(\d{2}):(\d{2})/);
  if (mt5) {
    const [, dd, mm, yyyy, hh, min, ss] = mt5;
    return new Date(`${yyyy}-${mm}-${dd}T${hh}:${min}:${ss}Z`).toISOString();
  }
  return null;
}

function inferAssetClass(instrument: string): AssetClass {
  const upper = instrument.toUpperCase();
  const cryptos = ["BTC", "ETH", "XRP", "LTC", "BNB", "SOL", "DOGE", "ADA", "AVAX"];
  const indices = ["US30", "US500", "NAS100", "UK100", "GER40", "JPN225", "AUS200", "SPX", "NDX", "DAX"];
  const metals = ["XAUUSD", "XAGUSD", "XPTUSD", "GOLD", "SILVER"];
  if (cryptos.some((c) => upper.includes(c))) return "CRYPTO";
  if (indices.some((i) => upper.includes(i))) return "INDICES";
  if (metals.some((m) => upper.includes(m))) return "COMMODITIES";
  // 6-char pairs = FOREX
  if (upper.length === 6 && /^[A-Z]+$/.test(upper)) return "FOREX";
  return "FOREX";
}

export function parseCsv(content: string): { headers: string[]; rows: CsvRow[] } {
  const result = Papa.parse<CsvRow>(content, {
    header: true,
    skipEmptyLines: true,
  });
  return {
    headers: result.meta.fields ?? [],
    rows: result.data,
  };
}

export function mapRows(rows: CsvRow[], mapping: ColumnMapping): ParsedTrade[] {
  const trades: ParsedTrade[] = [];

  for (const row of rows) {
    const instrument = (mapping.instrument ? row[mapping.instrument] : mapping.symbol ? row[mapping.symbol!] : "")?.trim();
    if (!instrument) continue;

    const dirRaw = mapping.direction ? row[mapping.direction] : "BUY";
    const direction = parseDirection(dirRaw ?? "BUY");

    const entryPrice = parseNum(mapping.entryPrice ? row[mapping.entryPrice] : undefined);
    if (!entryPrice) continue;

    const openTimeRaw = mapping.openTime ? row[mapping.openTime] : "";
    const openTime = parseDateTime(openTimeRaw ?? "");
    if (!openTime) continue;

    const closeTimeRaw = mapping.closeTime ? row[mapping.closeTime] : "";
    const closeTime = parseDateTime(closeTimeRaw ?? "");

    const grossPnl = parseNum(mapping.grossPnl ? row[mapping.grossPnl] : undefined);
    const commission = parseNum(mapping.commission ? row[mapping.commission] : undefined);
    const swap = parseNum(mapping.swap ? row[mapping.swap] : undefined);
    const netPnl =
      parseNum(mapping.netPnl ? row[mapping.netPnl] : undefined) ??
      (grossPnl != null
        ? grossPnl + (commission ?? 0) + (swap ?? 0)
        : null);

    trades.push({
      instrument: instrument.toUpperCase(),
      assetClass: inferAssetClass(instrument),
      direction,
      entryPrice,
      exitPrice: parseNum(mapping.exitPrice ? row[mapping.exitPrice] : undefined),
      stopLoss: parseNum(mapping.stopLoss ? row[mapping.stopLoss] : undefined),
      takeProfit: parseNum(mapping.takeProfit ? row[mapping.takeProfit] : undefined),
      lotSize: parseNum(mapping.lotSize ? row[mapping.lotSize] : undefined),
      grossPnl,
      netPnl,
      commission,
      swap,
      openTime,
      closeTime,
      status: closeTime ? "CLOSED" : "OPEN",
      externalId: mapping.externalId ? row[mapping.externalId]?.trim() : null,
      notes: mapping.notes ? row[mapping.notes]?.trim() : null,
      brokerMetadata: row,
    });
  }

  return trades;
}
