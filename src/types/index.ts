import type {
  Trade,
  TradingAccount,
  SetupTag,
  MistakeTag,
  Playbook,
  Screenshot,
  Note,
  Review,
  TradeTag,
  User,
} from "@prisma/client";

// Re-export prisma types for convenience
export type {
  Trade,
  TradingAccount,
  SetupTag,
  MistakeTag,
  Playbook,
  Screenshot,
  Note,
  Review,
  User,
};

// Trade with all relations loaded
export type TradeWithRelations = Trade & {
  account: TradingAccount;
  tradeTags: (TradeTag & {
    setupTag: SetupTag | null;
    mistakeTag: MistakeTag | null;
  })[];
  screenshots: Screenshot[];
};

// Analytics result shape
export interface AnalyticsResult {
  totalTrades: number;
  winCount: number;
  lossCount: number;
  breakevenCount: number;
  winRate: number;
  lossRate: number;
  breakevenRate: number;

  totalNetPnl: number;
  grossProfit: number;
  grossLoss: number;
  avgWin: number;
  avgLoss: number;
  avgNetPnl: number;

  profitFactor: number;
  expectancy: number;
  avgRR: number;

  maxDrawdown: number;
  maxDrawdownPct: number;

  avgHoldingMinutes: number;
  consecutiveWins: number;
  consecutiveLosses: number;

  avgExecutionScore: number;
  avgDisciplineScore: number;
  avgConfidenceScore: number;

  byInstrument: Record<string, InstrumentStats>;
  bySession: Record<string, SessionStats>;
  bySetupTag: Record<string, TagStats>;
  byMistakeTag: Record<string, MistakeStats>;
  byDayOfWeek: Record<string, DayStats>;

  equityCurve: { date: string; equity: number; drawdown: number }[];
  dailyPnl: { date: string; pnl: number; trades: number }[];
  mistakeFrequency: { name: string; count: number; pnlImpact: number }[];

  bestDay: { date: string; pnl: number } | null;
  worstDay: { date: string; pnl: number } | null;
}

export interface InstrumentStats {
  instrument: string;
  trades: number;
  wins: number;
  losses: number;
  netPnl: number;
  winRate: number;
  avgRR: number;
}

export interface SessionStats {
  session: string;
  trades: number;
  wins: number;
  losses: number;
  netPnl: number;
  winRate: number;
}

export interface TagStats {
  name: string;
  trades: number;
  wins: number;
  losses: number;
  netPnl: number;
  winRate: number;
  avgRR: number;
}

export interface MistakeStats {
  name: string;
  count: number;
  pnlImpact: number;
}

export interface DayStats {
  day: string;
  trades: number;
  wins: number;
  losses: number;
  netPnl: number;
  winRate: number;
}

// Filter params used across journal + analytics
export interface TradeFilters {
  accountId?: string;
  dateFrom?: string;
  dateTo?: string;
  assetClass?: string;
  session?: string;
  direction?: string;
  status?: string;
  tradeType?: string;
  setupTagId?: string;
  mistakeTagId?: string;
  instrument?: string;
}

// MT5 webhook payload
export interface MT5WebhookPayload {
  ticket: number;
  symbol: string;
  type: "BUY" | "SELL";
  volume: number;
  openPrice: number;
  closePrice?: number;
  sl: number;
  tp: number;
  openTime: string;
  closeTime?: string;
  profit: number;
  commission: number;
  swap: number;
  comment?: string;
  magic?: number;
}
