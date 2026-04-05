import { z } from "zod";

export const tradeSchema = z.object({
  accountId: z.string().min(1, "Account is required"),
  instrument: z.string().min(1, "Instrument is required"),
  assetClass: z.enum(["FOREX", "CRYPTO", "STOCKS", "INDICES", "COMMODITIES", "OTHER"]),
  direction: z.enum(["BUY", "SELL"]),
  entryPrice: z.number({ message: "Entry price is required" }).positive(),
  exitPrice: z.number().positive().optional().nullable(),
  stopLoss: z.number().positive().optional().nullable(),
  takeProfit: z.number().positive().optional().nullable(),
  lotSize: z.number().positive().optional().nullable(),
  positionSize: z.number().positive().optional().nullable(),
  riskAmount: z.number().optional().nullable(),
  rewardAmount: z.number().optional().nullable(),
  rrRatio: z.number().optional().nullable(),
  grossPnl: z.number().optional().nullable(),
  netPnl: z.number().optional().nullable(),
  commission: z.number().optional().nullable(),
  swap: z.number().optional().nullable(),
  openTime: z.string().datetime(),
  closeTime: z.string().datetime().optional().nullable(),
  holdingMinutes: z.number().int().optional().nullable(),
  session: z.enum(["ASIAN", "LONDON", "NEW_YORK", "LONDON_NY_OVERLAP"]).optional().nullable(),
  tradeType: z.enum(["LIVE", "DEMO", "BACKTEST"]).default("LIVE"),
  status: z.enum(["OPEN", "CLOSED", "CANCELLED"]).default("OPEN"),
  emotionBefore: z
    .enum(["CONFIDENT", "ANXIOUS", "CALM", "FEARFUL", "GREEDY", "NEUTRAL", "FRUSTRATED", "EXCITED"])
    .optional()
    .nullable(),
  emotionAfter: z
    .enum(["CONFIDENT", "ANXIOUS", "CALM", "FEARFUL", "GREEDY", "NEUTRAL", "FRUSTRATED", "EXCITED"])
    .optional()
    .nullable(),
  executionScore: z.number().int().min(1).max(10).optional().nullable(),
  disciplineScore: z.number().int().min(1).max(10).optional().nullable(),
  confidenceScore: z.number().int().min(1).max(10).optional().nullable(),
  preTradeReasoning: z.string().optional().nullable(),
  postTradeReview: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  setupTagIds: z.array(z.string()).optional(),
  mistakeTagIds: z.array(z.string()).optional(),
});

export type TradeFormValues = z.infer<typeof tradeSchema>;
