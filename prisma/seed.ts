import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import { subDays, addHours, addMinutes, startOfDay } from "date-fns";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const db = new PrismaClient({ adapter });

const INSTRUMENTS = [
  { name: "EURUSD", class: "FOREX" as const },
  { name: "GBPUSD", class: "FOREX" as const },
  { name: "USDJPY", class: "FOREX" as const },
  { name: "XAUUSD", class: "COMMODITIES" as const },
  { name: "BTCUSD", class: "CRYPTO" as const },
  { name: "US30", class: "INDICES" as const },
  { name: "GBPJPY", class: "FOREX" as const },
  { name: "EURCAD", class: "FOREX" as const },
];

const SESSIONS = ["ASIAN", "LONDON", "NEW_YORK", "LONDON_NY_OVERLAP"] as const;
const EMOTIONS = ["CONFIDENT", "CALM", "ANXIOUS", "NEUTRAL", "EXCITED"] as const;

function rnd(min: number, max: number) {
  return Math.random() * (max - min) + min;
}
function rndInt(min: number, max: number) {
  return Math.floor(rnd(min, max + 1));
}
function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function main() {
  console.log("🌱 Seeding TradeForge...");

  // ─── User ────────────────────────────────────────────────────────────────────
  const hashedPassword = await bcrypt.hash("demo1234", 12);

  const user = await db.user.upsert({
    where: { email: "demo@tradeforge.io" },
    update: {},
    create: {
      email: "demo@tradeforge.io",
      name: "Demo Trader",
      password: hashedPassword,
      plan: "PRO",
      timezone: "America/New_York",
    },
  });
  console.log("✓ Demo user created:", user.email);

  // ─── Trading Accounts ─────────────────────────────────────────────────────────
  const liveAccount = await db.tradingAccount.upsert({
    where: { id: "acc_live_demo" },
    update: {},
    create: {
      id: "acc_live_demo",
      userId: user.id,
      name: "Exness Live",
      broker: "Exness",
      accountNumber: "12345678",
      currency: "USD",
      balance: 12340.5,
      type: "LIVE",
      isDefault: true,
    },
  });

  const demoAccount = await db.tradingAccount.upsert({
    where: { id: "acc_demo_demo" },
    update: {},
    create: {
      id: "acc_demo_demo",
      userId: user.id,
      name: "Paper Trading",
      broker: "MetaTrader 5",
      currency: "USD",
      balance: 50000,
      type: "DEMO",
      isDefault: false,
    },
  });

  const backtestAccount = await db.tradingAccount.upsert({
    where: { id: "acc_bt_demo" },
    update: {},
    create: {
      id: "acc_bt_demo",
      userId: user.id,
      name: "Backtest 2024",
      broker: "Backtester",
      currency: "USD",
      type: "BACKTEST",
      isDefault: false,
    },
  });

  console.log("✓ 3 trading accounts created");

  // ─── Setup Tags ────────────────────────────────────────────────────────────────
  const setupTagDefs = [
    { name: "BOS", color: "#6366f1" },
    { name: "CHOCH", color: "#8b5cf6" },
    { name: "FVG", color: "#06b6d4" },
    { name: "Order Block", color: "#3b82f6" },
    { name: "Liquidity Sweep", color: "#f59e0b" },
    { name: "Breakout Retest", color: "#10b981" },
    { name: "SR Bounce", color: "#14b8a6" },
    { name: "Reversal Zone", color: "#ec4899" },
  ];

  const setupTags = await Promise.all(
    setupTagDefs.map((t) =>
      db.setupTag.upsert({
        where: { userId_name: { userId: user.id, name: t.name } },
        update: {},
        create: { userId: user.id, ...t },
      })
    )
  );
  console.log("✓ 8 setup tags created");

  // ─── Mistake Tags ──────────────────────────────────────────────────────────────
  const mistakeTagDefs = [
    { name: "FOMO", category: "Psychology", color: "#ef4444" },
    { name: "Early Entry", category: "Execution", color: "#f97316" },
    { name: "No Stop Loss", category: "Risk", color: "#dc2626" },
    { name: "Overtrading", category: "Discipline", color: "#b91c1c" },
    { name: "Revenge Trading", category: "Psychology", color: "#991b1b" },
    { name: "Poor RR", category: "Risk", color: "#ea580c" },
    { name: "Ignored Trend", category: "Analysis", color: "#d97706" },
    { name: "Broke Plan", category: "Discipline", color: "#c2410c" },
  ];

  const mistakeTags = await Promise.all(
    mistakeTagDefs.map((t) =>
      db.mistakeTag.upsert({
        where: { userId_name: { userId: user.id, name: t.name } },
        update: {},
        create: { userId: user.id, ...t },
      })
    )
  );
  console.log("✓ 8 mistake tags created");

  // ─── Playbooks ─────────────────────────────────────────────────────────────────
  await db.playbook.upsert({
    where: { id: "pb_bos_demo" },
    update: {},
    create: {
      id: "pb_bos_demo",
      userId: user.id,
      name: "BOS Continuation",
      description: "Trade the break of structure in the direction of the higher timeframe trend.",
      rules:
        "1. Identify HTF trend direction\n2. Wait for BOS on LTF (structure breaks in HTF direction)\n3. Wait for pullback to OB/FVG\n4. Enter on confirmation candle",
      timeframes: ["M15", "H1", "H4"],
      entryConditions:
        "- HTF trend confirmed\n- BOS on entry TF\n- Valid OB or FVG present\n- Liquidity taken before entry",
      invalidConditions:
        "- Counter-trend setup\n- No clear BOS\n- Entering at premium when looking for longs",
      targetRrMin: 2.0,
      targetRrMax: 5.0,
      notes: "Best during London and NY sessions. Avoid Asian choppy sessions.",
      checklist: [
        { item: "HTF trend confirmed", required: true },
        { item: "BOS visible on entry timeframe", required: true },
        { item: "OB or FVG identified", required: true },
        { item: "Liquidity swept", required: false },
        { item: "RR ≥ 2R", required: true },
      ],
    },
  });

  await db.playbook.upsert({
    where: { id: "pb_fvg_demo" },
    update: {},
    create: {
      id: "pb_fvg_demo",
      userId: user.id,
      name: "FVG Fill",
      description: "Enter when price returns to fill a Fair Value Gap with confluence.",
      rules:
        "1. Mark FVG on M15 or H1\n2. Wait for price to pull back to FVG\n3. Confirm with entry TF price action\n4. Set SL below FVG, TP at next liquidity pool",
      timeframes: ["M5", "M15", "H1"],
      entryConditions:
        "- FVG clearly identified\n- Price approaching from premium/discount\n- Confirmation candle at FVG",
      invalidConditions: "- FVG already partially filled\n- Counter-trend without confirmation",
      targetRrMin: 1.5,
      targetRrMax: 3.0,
      checklist: [
        { item: "FVG clearly marked", required: true },
        { item: "HTF agrees with direction", required: true },
        { item: "Entry confirmation candle", required: true },
      ],
    },
  });

  console.log("✓ 2 playbooks created");

  // ─── 50 Sample Trades ─────────────────────────────────────────────────────────
  // Remove existing demo trades first
  await db.trade.deleteMany({ where: { userId: user.id } });

  const tradeScenarios = [
    // Win scenarios
    { pnlMultiplier: 1.8, isWin: true, rr: 2.1, setupIdx: 0, mistakeIdx: null },
    { pnlMultiplier: 2.3, isWin: true, rr: 2.8, setupIdx: 1, mistakeIdx: null },
    { pnlMultiplier: 0.9, isWin: true, rr: 1.2, setupIdx: 2, mistakeIdx: null },
    { pnlMultiplier: 3.1, isWin: true, rr: 3.5, setupIdx: 0, mistakeIdx: null },
    { pnlMultiplier: 1.5, isWin: true, rr: 1.8, setupIdx: 3, mistakeIdx: null },
    { pnlMultiplier: 2.0, isWin: true, rr: 2.4, setupIdx: 4, mistakeIdx: null },
    { pnlMultiplier: 1.2, isWin: true, rr: 1.5, setupIdx: 5, mistakeIdx: null },
    { pnlMultiplier: 4.2, isWin: true, rr: 5.0, setupIdx: 0, mistakeIdx: null },
    { pnlMultiplier: 1.6, isWin: true, rr: 2.0, setupIdx: 2, mistakeIdx: null },
    { pnlMultiplier: 0.8, isWin: true, rr: 1.0, setupIdx: 6, mistakeIdx: null },
    { pnlMultiplier: 2.5, isWin: true, rr: 3.0, setupIdx: 1, mistakeIdx: null },
    { pnlMultiplier: 1.9, isWin: true, rr: 2.2, setupIdx: 7, mistakeIdx: null },
    { pnlMultiplier: 1.1, isWin: true, rr: 1.3, setupIdx: 3, mistakeIdx: null },
    { pnlMultiplier: 3.5, isWin: true, rr: 4.1, setupIdx: 0, mistakeIdx: null },
    { pnlMultiplier: 2.8, isWin: true, rr: 3.2, setupIdx: 4, mistakeIdx: null },
    { pnlMultiplier: 1.4, isWin: true, rr: 1.7, setupIdx: 5, mistakeIdx: null },
    { pnlMultiplier: 2.1, isWin: true, rr: 2.5, setupIdx: 2, mistakeIdx: null },
    { pnlMultiplier: 1.7, isWin: true, rr: 2.0, setupIdx: 6, mistakeIdx: null },
    { pnlMultiplier: 0.6, isWin: true, rr: 0.8, setupIdx: 7, mistakeIdx: null },
    { pnlMultiplier: 1.3, isWin: true, rr: 1.6, setupIdx: 1, mistakeIdx: null },
    { pnlMultiplier: 2.9, isWin: true, rr: 3.4, setupIdx: 0, mistakeIdx: null },
    { pnlMultiplier: 1.0, isWin: true, rr: 1.2, setupIdx: 3, mistakeIdx: null },
    { pnlMultiplier: 3.8, isWin: true, rr: 4.5, setupIdx: 4, mistakeIdx: null },
    { pnlMultiplier: 1.6, isWin: true, rr: 1.9, setupIdx: 5, mistakeIdx: null },
    { pnlMultiplier: 2.2, isWin: true, rr: 2.6, setupIdx: 2, mistakeIdx: null },
    { pnlMultiplier: 1.8, isWin: true, rr: 2.1, setupIdx: 7, mistakeIdx: null },
    { pnlMultiplier: 0.7, isWin: true, rr: 0.9, setupIdx: 6, mistakeIdx: null },
    { pnlMultiplier: 1.4, isWin: true, rr: 1.7, setupIdx: 0, mistakeIdx: null },
    { pnlMultiplier: 2.6, isWin: true, rr: 3.1, setupIdx: 1, mistakeIdx: null },
    // Loss scenarios
    { pnlMultiplier: -1.0, isWin: false, rr: -1.0, setupIdx: 0, mistakeIdx: 0 },
    { pnlMultiplier: -1.0, isWin: false, rr: -1.0, setupIdx: 1, mistakeIdx: 1 },
    { pnlMultiplier: -1.0, isWin: false, rr: -1.0, setupIdx: 2, mistakeIdx: 2 },
    { pnlMultiplier: -1.0, isWin: false, rr: -1.0, setupIdx: null, mistakeIdx: 3 },
    { pnlMultiplier: -1.5, isWin: false, rr: -1.0, setupIdx: null, mistakeIdx: 4 },
    { pnlMultiplier: -1.0, isWin: false, rr: -1.0, setupIdx: 3, mistakeIdx: 5 },
    { pnlMultiplier: -1.0, isWin: false, rr: -1.0, setupIdx: 4, mistakeIdx: 6 },
    { pnlMultiplier: -2.0, isWin: false, rr: -1.0, setupIdx: null, mistakeIdx: 7 },
    { pnlMultiplier: -1.0, isWin: false, rr: -1.0, setupIdx: 5, mistakeIdx: 0 },
    { pnlMultiplier: -1.0, isWin: false, rr: -1.0, setupIdx: 6, mistakeIdx: 1 },
    { pnlMultiplier: -1.0, isWin: false, rr: -1.0, setupIdx: null, mistakeIdx: 3 },
    { pnlMultiplier: -1.8, isWin: false, rr: -1.0, setupIdx: null, mistakeIdx: 4 },
    { pnlMultiplier: -1.0, isWin: false, rr: -1.0, setupIdx: 7, mistakeIdx: 7 },
    { pnlMultiplier: -1.0, isWin: false, rr: -1.0, setupIdx: 0, mistakeIdx: 6 },
    { pnlMultiplier: -1.0, isWin: false, rr: -1.0, setupIdx: 2, mistakeIdx: 5 },
    { pnlMultiplier: -1.0, isWin: false, rr: -1.0, setupIdx: 1, mistakeIdx: 2 },
    { pnlMultiplier: -1.2, isWin: false, rr: -1.0, setupIdx: null, mistakeIdx: 0 },
    { pnlMultiplier: -1.0, isWin: false, rr: -1.0, setupIdx: 3, mistakeIdx: null },
    { pnlMultiplier: -1.0, isWin: false, rr: -1.0, setupIdx: 4, mistakeIdx: 1 },
    { pnlMultiplier: -1.0, isWin: false, rr: -1.0, setupIdx: 5, mistakeIdx: 3 },
    // Open trades
    { pnlMultiplier: 0, isWin: false, rr: null, setupIdx: 0, mistakeIdx: null, isOpen: true },
  ];

  const riskPerTrade = 100; // $100 risk per trade

  for (let i = 0; i < tradeScenarios.length; i++) {
    const scenario = tradeScenarios[i];
    const daysAgo = Math.floor((tradeScenarios.length - i) * 1.7);
    const tradeDate = subDays(new Date(), daysAgo);
    const sessionHours: Record<string, number> = {
      ASIAN: 2,
      LONDON: 9,
      NEW_YORK: 14,
      LONDON_NY_OVERLAP: 13,
    };
    const session = pick([...SESSIONS]);
    const openTime = addHours(startOfDay(tradeDate), sessionHours[session] + rnd(-1, 1));
    const isOpen = (scenario as any).isOpen ?? false;
    const holdingMins = rndInt(15, 240);
    const closeTime = isOpen ? null : addMinutes(openTime, holdingMins);

    const instrument = pick(INSTRUMENTS);
    const direction = Math.random() > 0.5 ? "BUY" : "SELL";
    const basePrice = instrument.name === "XAUUSD" ? 2340 + rnd(-50, 50) : instrument.name === "BTCUSD" ? 65000 + rnd(-2000, 2000) : instrument.name === "US30" ? 39000 + rnd(-500, 500) : instrument.name.includes("JPY") ? 155 + rnd(-2, 2) : 1.08 + rnd(-0.05, 0.05);

    const pips = 20 + rnd(5, 40);
    const pip = instrument.name.includes("JPY") ? 0.01 : instrument.name === "XAUUSD" ? 0.1 : instrument.name === "BTCUSD" ? 10 : 0.0001;
    const sl = direction === "BUY" ? basePrice - pips * pip : basePrice + pips * pip;
    const rrTarget = Math.abs(scenario.rr ?? 2);
    const tp = direction === "BUY" ? basePrice + pips * pip * rrTarget : basePrice - pips * pip * rrTarget;

    const netPnl = isOpen ? null : Math.round(riskPerTrade * scenario.pnlMultiplier * 100) / 100;
    const grossPnl = netPnl != null ? netPnl + rnd(0.5, 3) : null;
    const commission = -rnd(1, 3);

    const execScore = scenario.isWin ? rndInt(6, 10) : rndInt(3, 7);
    const discScore = (scenario as any).mistakeIdx != null ? rndInt(2, 6) : rndInt(6, 10);

    const tags = [];
    if (scenario.setupIdx !== null) {
      tags.push({ setupTagId: setupTags[scenario.setupIdx].id });
    }
    if ((scenario as any).mistakeIdx !== null) {
      tags.push({ mistakeTagId: mistakeTags[(scenario as any).mistakeIdx].id });
    }

    await db.trade.create({
      data: {
        userId: user.id,
        accountId: i % 5 === 0 ? demoAccount.id : liveAccount.id,
        instrument: instrument.name,
        assetClass: instrument.class,
        direction: direction as any,
        entryPrice: basePrice,
        exitPrice: isOpen ? null : (direction === "BUY" ? basePrice + (netPnl! > 0 ? pips * pip * rrTarget : -pips * pip) : basePrice - (netPnl! > 0 ? pips * pip * rrTarget : -pips * pip)),
        stopLoss: sl,
        takeProfit: tp,
        lotSize: 0.1,
        positionSize: riskPerTrade,
        riskAmount: riskPerTrade,
        rewardAmount: netPnl != null && netPnl > 0 ? netPnl : null,
        rrRatio: isOpen ? null : scenario.rr,
        grossPnl: grossPnl,
        netPnl: netPnl,
        commission: commission,
        swap: rnd(-0.5, 0.5),
        openTime,
        closeTime,
        holdingMinutes: isOpen ? null : holdingMins,
        session: session as any,
        tradeType: i % 5 === 0 ? "DEMO" : "LIVE",
        status: isOpen ? "OPEN" : "CLOSED",
        emotionBefore: pick([...EMOTIONS]) as any,
        emotionAfter: isOpen ? null : pick([...EMOTIONS]) as any,
        executionScore: execScore,
        disciplineScore: discScore,
        confidenceScore: rndInt(5, 10),
        preTradeReasoning: scenario.setupIdx !== null ? `${setupTags[scenario.setupIdx].name} setup identified on ${pick(["M15", "H1"])} with ${direction === "BUY" ? "discount" : "premium"} entry. HTF trend aligned.` : null,
        postTradeReview: isOpen ? null : (scenario.isWin ? "Good execution. Followed the plan. Entry was precise." : "Trade lost. " + (scenario.mistakeIdx !== null ? `Mistake: ${mistakeTagDefs[scenario.mistakeIdx!].name}. Need to review.` : "Setup invalidated.")),
        tradeTags: {
          create: tags,
        },
      },
    });
  }

  console.log("✓ 51 sample trades created");

  // ─── Notes ────────────────────────────────────────────────────────────────────
  const noteContents = [
    { type: "PRE_MARKET" as const, content: "## Pre-Market Plan\n\nDXY looking bearish. Expecting EURUSD to push higher. Watching for BOS on H1 before entries. Key levels: 1.0920 support, 1.1050 resistance.\n\n**Bias:** Bullish EUR\n**Session focus:** London open" },
    { type: "POST_MARKET" as const, content: "## Post-Market Review\n\nGood day overall. Caught 2 trades on EURUSD. Missed one FVG fill on GBPUSD - was distracted. Need to be more present during London open.\n\n**P&L:** +$240\n**Execution:** 7/10" },
    { type: "WEEKLY" as const, content: "## Weekly Reflection\n\n**Week summary:** Strong week with 4 wins and 2 losses. Win rate 66%.\n\n**What worked:** BOS setups performed well during London session.\n\n**What to improve:** Stop entering during news events.\n\n**Goals next week:** No trading during red-folder news." },
    { type: "LESSON" as const, content: "## Lesson: Patience is the Edge\n\nThis week I learned that the best trades are the ones you wait for. I forced 2 trades that didn't meet my criteria and both lost. The 3 trades I was patient on all hit TP.\n\nKey takeaway: If the setup isn't perfect, skip it." },
    { type: "PRE_MARKET" as const, content: "## Pre-Market Analysis\n\nGold (XAUUSD) at key HTF resistance zone. Watching for rejection or breakout. GBPUSD forming potential BOS on H4.\n\n**Focus pairs:** XAUUSD, GBPUSD\n**Risk today:** $200 max" },
  ];

  for (const note of noteContents) {
    await db.note.create({
      data: {
        userId: user.id,
        type: note.type,
        date: subDays(new Date(), rndInt(1, 14)),
        content: note.content,
      },
    });
  }
  console.log("✓ 5 notes created");

  // ─── Reviews ──────────────────────────────────────────────────────────────────
  await db.review.create({
    data: {
      userId: user.id,
      type: "WEEKLY",
      periodStart: subDays(new Date(), 14),
      periodEnd: subDays(new Date(), 7),
      summary: "Strong week with 66% win rate. BOS setups outperformed all others. London session most profitable.",
      improvements: "- Avoid trading during high-impact news\n- Wait for full confluence before entering\n- Reduce position size on counter-trend trades",
      lessons: "Patience is the edge. Waiting for perfect setups produced significantly better results than forcing entries.",
      goals: "- Achieve 70% win rate next week\n- Only trade A+ setups\n- Complete post-market review every day",
      score: 7,
    },
  });

  await db.review.create({
    data: {
      userId: user.id,
      type: "MONTHLY",
      periodStart: subDays(new Date(), 35),
      periodEnd: subDays(new Date(), 5),
      summary: "Best month so far. Consistent execution on BOS and FVG setups. Reduced mistake frequency by 40% vs last month.",
      improvements: "- Risk management needs work — two over-sized positions this month\n- Need to journal every trade same day\n- Improve pre-market routine",
      lessons: "Consistency beats home runs. Small steady gains from A+ setups compound faster than chasing big moves.",
      goals: "- Hit $5K profit milestone\n- Keep mistake rate below 20%\n- Start backtesting new setups before live trading",
      score: 8,
    },
  });

  console.log("✓ 2 reviews created");
  console.log("\n✅ Seeding complete!");
  console.log("   Login: demo@tradeforge.io / demo1234");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
