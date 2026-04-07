# TradeForge — User Manual

**Version:** 1.0 | **Live URL:** https://tradeforge-psi.vercel.app

---

## Table of Contents

1. [Getting Started](#1-getting-started)
2. [Dashboard](#2-dashboard)
3. [Trade Journal](#3-trade-journal)
4. [Analytics](#4-analytics)
5. [Import Trades](#5-import-trades)
6. [Playbooks](#6-playbooks)
7. [Mistake Tracker](#7-mistake-tracker)
8. [Trading Calendar](#8-trading-calendar)
9. [Reviews](#9-reviews)
10. [Notes](#10-notes)
11. [Trade Replay](#11-trade-replay)
12. [Backtest Journal](#12-backtest-journal)
13. [Settings](#13-settings)
14. [Billing](#14-billing)
15. [Notifications](#15-notifications)

---

## 1. Getting Started

### Creating an Account

1. Go to https://tradeforge-psi.vercel.app
2. Click **Get started free** on the landing page
3. Enter your name, email, and password (minimum 8 characters)
4. Click **Create Account** — you are automatically logged in
5. A default **Live** trading account is created for you

### Demo Account

To explore the app with pre-loaded data:

| | |
|---|---|
| **Email** | demo@tradeforge.io |
| **Password** | demo1234 |

This account contains 50 sample trades across 90 days, 3 accounts, playbooks, tags, and reviews.

### Logging In

1. Go to `/login`
2. Enter your email and password
3. Click **Sign in**

### Logging Out

Click your name/avatar in the top-right corner → **Sign out**

---

## 2. Dashboard

**URL:** `/dashboard`

The dashboard is your performance overview at a glance.

### KPI Cards (top row)

| Card | What it shows |
|---|---|
| **Net P&L** | Total profit/loss across all closed trades |
| **Win Rate** | Percentage of winning trades |
| **Profit Factor** | Gross profit ÷ gross loss (above 1.0 = profitable) |
| **Avg RR** | Average risk-to-reward ratio achieved |
| **Expectancy** | Average $ earned per trade (edge measurement) |
| **Max Drawdown** | Largest peak-to-trough equity drop |

### Charts

- **Equity Curve** — cumulative P&L over time; a rising line means consistent profitability
- **Daily P&L Bar** — green/red bars for each trading day; spot your best and worst days quickly
- **Win/Loss Donut** — visual split of wins, losses, and breakeven trades
- **Instrument Breakdown** — horizontal bars showing P&L by currency pair or asset

### Recent Trades

The last 5 closed trades appear at the bottom for a quick status check.

> **Tip:** All dashboard data reflects your currently selected date range and account. Use filters at the top of Analytics to drill down further.

---

## 3. Trade Journal

**URL:** `/journal`

The journal is the core of TradeForge — every trade lives here.

### Viewing Trades

The journal table shows all your trades with:

- Date & time opened
- Instrument (e.g. EURUSD, BTCUSD)
- Account name
- Direction (BUY / SELL)
- Entry price
- Net P&L (colour-coded green/red)
- RR ratio
- Session
- Setup & mistake tags
- Status badge (OPEN / WIN / LOSS / BE)

Click any **instrument name** to open the full trade detail page.

### Filtering & Sorting

Use the filter bar at the top of the journal:

| Filter | Options |
|---|---|
| **Search** | Type any instrument name |
| **Account** | Filter by trading account |
| **Direction** | BUY or SELL |
| **Status** | Open or Closed |
| **Session** | Asian, London, New York, London/NY Overlap |

Click any **column header** (Date, Instrument, P&L, RR, Status) to sort ascending or descending.

### Adding a Trade Manually

1. Click **+ New Trade** (top-right of journal page)
2. Fill in the required fields:
   - **Account** — which trading account this belongs to
   - **Instrument** — symbol (e.g. EURUSD, GOLD, NAS100)
   - **Asset Class** — Forex, Crypto, Stocks, Indices, Commodities, Other
   - **Direction** — BUY (long) or SELL (short)
   - **Entry Price** — your actual entry
   - **Open Time** — when you entered the trade
3. Fill in optional fields for richer analytics:
   - Exit Price, Stop Loss, Take Profit
   - Lot Size, Position Size
   - Risk Amount, Reward Amount, RR Ratio
   - Close Time (auto-calculates holding minutes)
   - Session
   - Trade Type (Live / Demo / Backtest)
4. Click **Save Trade**

### Trade Detail Page

Click any trade to open its full detail view. From here you can:

**View:**
- All trade metrics in a structured layout
- P&L, RR, holding time, session, trade type

**Edit:**
- Click **Edit Trade** to modify any field
- Add or change setup tags and mistake tags
- Record emotions before and after (Confident, Anxious, Calm, Fearful, etc.)
- Score your execution (1–10), discipline (1–10), confidence (1–10)
- Write pre-trade reasoning
- Write a post-trade review
- Add general notes

**Screenshots:**
- Click **Upload Screenshot** (or the upload zone) to attach chart images
- Supported: JPG, PNG up to 8 MB, up to 5 per trade
- Click the **×** on any screenshot to delete it
- Screenshots are stored securely and accessible from the Replay viewer

**Delete:**
- Click **Delete Trade** → confirm to permanently remove

---

## 4. Analytics

**URL:** `/analytics`

Deep performance analysis across all your trades.

### Filters

At the top of the page, use the filter bar to narrow down:

| Filter | Description |
|---|---|
| **From / To** | Date range for trades to include |
| **Account** | Specific trading account |
| **Asset Class** | Forex, Crypto, Stocks, etc. |
| **Direction** | Long (BUY) or Short (SELL) only |

Click **Apply** to reload all charts and stats. Click **Clear** to reset to all-time.

### Performance Stats (3 panels)

**Performance**
- Total Net P&L, Gross Profit, Gross Loss
- Profit Factor, Expectancy, Average Trade

**Win/Loss Stats**
- Win Rate, Loss Rate
- Average Win amount, Average Loss amount
- Average RR, Consecutive Wins/Losses record

**Risk & Discipline**
- Max Drawdown ($ and %)
- Average Holding Time
- Average Execution Score, Discipline Score, Confidence Score
- Best Day, Worst Day

### Charts

- **Equity Curve** — cumulative P&L plotted over time
- **Drawdown Chart** — how far you fell from peak equity at each point
- **Session Performance** — P&L cards for each session (Asian, London, New York, London/NY Overlap) plus a summary table
- **Performance by Setup** — win rate bar and P&L for each setup tag you use
- **Win/Loss Split** — donut chart breakdown
- **Mistake Frequency** — horizontal bar chart of your most common mistakes
- **By Instrument** — P&L breakdown per symbol
- **Performance by Day of Week** — which days of the week you perform best

---

## 5. Import Trades

**URL:** `/import`

Two methods to bring your existing trades into TradeForge.

---

### Method A: Broker Auto-Sync (MT5 / MT4)

Auto-sync connects directly to your broker using your **Investor (read-only) password**. TradeForge cannot place or modify trades — it only reads history.

**Step 1 — Choose Broker**
- Select **MetaTrader 5** or **MetaTrader 4** from the broker grid
- Search for your broker by name if not listed

**Step 2 — Select Method**
- Choose **Auto-sync** (recommended for MT5/MT4)

**Step 3 — Enter Credentials**

| Field | What to enter | Where to find it |
|---|---|---|
| **Start date** | Earliest trade date to import (leave blank for all history) | — |
| **Server** | Your broker's MT5 server name | MT5 login dialog → Server dropdown, or your broker's welcome email. Example: `Exness-MT5Trial2`, `ICMarkets-Live01` |
| **Login** | Your MT5 account number (numbers only) | MT5 title bar or login dialog. Example: `87654321` |
| **Investor Password** | Your MT5 read-only password | MT5 → Tools → Options → Server tab → next to "Investor Password". Or check your broker's account creation email |
| **Link to Account** | Which TradeForge account to save trades under | Select from your accounts |

Click **Connect** — TradeForge provisions your account on MetaApi and begins syncing.

**After connecting:**
- A **Connected Brokers** panel appears at the top of the Import page
- Status shows: Pending → Connecting → Active
- Click **Sync** at any time to pull the latest trades
- Click the trash icon to disconnect a broker

> **Note:** Stocks, Futures, and Options are not supported via MT5 auto-sync. Supported: Forex, Crypto, CFD.

---

### Method B: CSV File Upload

For any broker not supported by auto-sync, or for historical imports.

**Step 1 — Switch to CSV Upload tab**
- Click **CSV Upload** at the top of the Import page

**Exporting from MT5:**
1. Open MetaTrader 5
2. View → Terminal → History tab
3. Right-click → Select All History
4. Right-click → Save as Report → Detailed Report (.htm)
5. Open the .htm in Excel → Save As → CSV

**Upload & Map:**
1. Click the upload zone and select your CSV file
2. Select your **Account** and **Trade Type** (Live / Demo / Backtest)
3. Select a **Template:**
   - **MT5 Detailed Report** — auto-maps MT5 column names
   - **Generic CSV** — auto-maps common column names
   - **Manual** — map each column yourself
4. In the Column Mapping section, match each CSV column to the correct TradeForge field (required: Instrument, Direction, Entry Price, Open Time)
5. Click **CSV Preview** to verify the first 5 rows
6. Click **Import X Trades**
7. Duplicates (matched by external ID) are automatically skipped

**Download the MT5 template:** The Import page includes a download link for the standard MT5 CSV template.

---

### Method C: Add Manually

- Choose **Add manually** from the method selection screen
- You are taken directly to the **New Trade** form
- Fill in each field and save

---

## 6. Playbooks

**URL:** `/playbooks`

Document your trading setups in a structured library.

### What is a Playbook?

A playbook is a defined trading strategy or setup with rules, entry conditions, and expected outcomes. Examples: BOS Continuation, FVG Fill, Liquidity Sweep Reversal.

### Creating a Playbook

1. Click **+ New Playbook**
2. Enter a **Name** (e.g. "BOS Continuation")
3. Fill in any combination of:
   - **Description** — what this setup is
   - **Rules** — non-negotiable conditions to trade it
   - **Timeframes** — which timeframes apply (e.g. H1, M15)
   - **Entry Conditions** — specific criteria that confirm entry
   - **Invalid Conditions** — when NOT to take the trade
   - **Target RR Min / Max** — acceptable risk-to-reward range
   - **Checklist** — pre-entry items to tick before executing (add/remove items dynamically)
   - **Notes** — free-form observations

### Linking Trades to a Playbook

When tagging a trade, select a **Setup Tag** that is linked to a playbook. Analytics will then group performance by playbook automatically.

### Editing & Deleting

- Click any playbook card to open its detail view
- All fields are editable inline
- Click **Delete** at the bottom to remove

---

## 7. Mistake Tracker

**URL:** `/mistakes`

Track recurring errors that cost you money.

### Overview

The Mistakes page shows:

- **Top 4 Mistakes** — frequency count and total P&L impact for your most common errors
- **Frequency Chart** — horizontal bar chart of all mistake tags ranked by occurrence

### Tagging Mistakes on Trades

1. Open any trade detail page
2. In **Edit** mode, scroll to the **Mistake Tags** field
3. Select one or more mistake tags (e.g. FOMO, Early Entry, No SL)
4. Save — the mistake is now tracked in analytics

### Managing Mistake Tags

Go to **Settings → Tags** tab:
- Add new mistake tags with a custom name and colour
- Hover over any tag → pencil icon to rename, trash to delete

### Default Mistake Tags

| Tag | Meaning |
|---|---|
| FOMO | Entered because of fear of missing a move |
| Early Entry | Entered before confirmation |
| Late Entry | Chased price after the move |
| No SL | Traded without a stop loss |
| Overtrading | Too many trades in a session |
| Revenge Trade | Traded emotionally after a loss |
| Poor RR | Took a trade with insufficient reward vs risk |
| Ignored Trend | Traded against the clear trend |

---

## 8. Trading Calendar

**URL:** `/calendar`

A monthly performance calendar for daily P&L overview.

### Reading the Calendar

- **Green cells** — profitable days
- **Red cells** — losing days
- **Grey cells** — no closed trades
- The darker the colour, the larger the P&L

### Navigating Months

Use the **← →** arrows at the top to move between months. The **Month Total** P&L is displayed in the header.

### Day Detail

Click any day cell to open the day detail panel on the right:
- Lists every closed trade for that day
- Shows instrument, direction, entry price, exit price, and net P&L for each trade
- Click any trade to go to its detail page

---

## 9. Reviews

**URL:** `/reviews/weekly` and `/reviews/monthly`

Structured reflection to track growth over time.

### Weekly Reviews

1. Go to **Reviews → Weekly**
2. Click **+ New Review**
3. The review period auto-fills (Monday–Sunday of the current week)
4. Fill in:
   - **Summary** — how the week went overall
   - **What to Improve** — specific areas to focus on
   - **Key Lessons** — what you learned
   - **Goals for Next Week** — concrete targets
   - **Score** — rate the week 1–10
5. Click **Save Review**

### Monthly Reviews

Same process at `/reviews/monthly` — period covers the full calendar month.

### Viewing Past Reviews

All saved reviews are listed below the new review form, sorted by most recent. Click **Edit** on any review to update it.

---

## 10. Notes

**URL:** `/notes`

A structured note system for market planning and reflection.

### Note Types

| Type | Purpose |
|---|---|
| **Pre-Market** | Morning plan — bias, levels to watch, setups to look for |
| **Post-Market** | End of day review — what happened, what you did well/poorly |
| **Weekly** | Weekly market outlook or reflection |
| **Monthly** | Monthly market context and goals |
| **Lesson** | Standalone lessons learned that don't fit a review |

### Creating a Note

1. Click **+ New Note**
2. Select the **Type**
3. Write your note content (free text, supports line breaks)
4. Click **Save**

### Filtering Notes

Use the **type filter** tabs at the top to view only Pre-Market, Post-Market, Lessons, etc.

### Editing & Deleting

Click the pencil icon on any note to edit. Click the trash icon to delete.

---

## 11. Trade Replay

**URL:** `/replay` and `/replay/[trade-id]`

Review your trades screenshot by screenshot.

### Opening a Replay

- From the **Replay** page: browse the list of trades that have screenshots attached
- From a **Trade Detail** page: click the replay link

### Replay Controls

- **← →** arrows to navigate between screenshots
- **Zoom** button to expand a screenshot full-screen
- **Comments panel** to add annotations at each screenshot (e.g. "This is where I should have exited")

### Best Practice

Upload 2–3 screenshots per trade:
1. **Setup screenshot** — the chart before entry showing your analysis
2. **Entry screenshot** — the moment you entered
3. **Result screenshot** — the final outcome with marked levels

This lets you replay the decision-making process and identify where your execution diverged from your plan.

---

## 12. Backtest Journal

**URL:** `/backtest`

A dedicated journal for backtesting your strategies.

### What is it?

The backtest journal separates simulated historical trades from your live and demo trading. Use it to test a setup on past data before trading it live.

### Logging a Backtest Trade

1. Go to **Journal → + New Trade**
2. Set **Trade Type** to **Backtest**
3. Fill in the trade details as normal
4. Save — the trade appears in the Backtest section, not in your live analytics

### Backtest Analytics

The Backtest page shows:
- Net P&L, Win Rate, Profit Factor, Total Trades — all from backtest trades only
- Equity curve for the backtest period

This lets you validate a strategy's edge before risking real capital.

---

## 13. Settings

**URL:** `/settings`

Manage your profile, accounts, tags, and MT5 integration.

### Profile Tab

- **Display Name** — change the name shown in the app
- **Email** — read-only (set at signup)
- **Plan** — your current subscription tier
- Click **Save Profile** to apply changes

### Accounts Tab

Manage your trading accounts (each account tracks its own trades).

**Adding an Account:**
1. Fill in Name (required), Broker, Account Number, Currency, and Type (Live / Demo / Backtest)
2. Click **Add Account**

**Deleting an Account:**
- Click the trash icon next to an account
- Warning: this deletes the account and ALL trades attached to it

**Default Account:**
- The account marked **Default** is pre-selected in trade forms

### Tags Tab

**Setup Tags** — label the strategies/setups you use (e.g. BOS, FVG, OB)

**Mistake Tags** — label recurring errors (e.g. FOMO, Early Entry)

**For each tag you can:**
- Add new tags with a name and colour (click the colour picker)
- Hover over a tag → **pencil icon** to rename or change colour → **✓** to save
- Hover over a tag → **trash icon** to delete permanently

### MT5 Integration Tab

Step-by-step guide to download and configure the TradeForge Expert Advisor for real-time trade pushing from MT5 to TradeForge via webhook.

1. Download `TradeForge_EA.mq5`
2. Place in MT5 Experts folder
3. Set WebhookURL, AccountID, and HMACSecret in EA inputs
4. Attach to any chart with "Allow WebRequests" enabled

---

## 14. Billing

**URL:** `/settings/billing`

View your current plan and upcoming pricing tiers.

| Plan | Price | Key Limits |
|---|---|---|
| **Free** | $0 | Up to 50 trades/month, 1 account, basic analytics |
| **Starter** | $9/mo | Unlimited trades, 3 accounts, full analytics, playbooks |
| **Pro** | $19/mo | Everything in Starter + MetaApi live sync, trade replay, backtesting |
| **Elite** | $39/mo | Everything in Pro + AI insights, AI weekly summaries, unlimited storage |

Stripe payments are coming soon. Early users will receive a discount.

---

## 15. Notifications

**URL:** `/settings/notifications`

Configure reminder preferences for your trading routine.

| Reminder | Default | Purpose |
|---|---|---|
| Daily trade review | On | Remind you to tag and review today's trades |
| Weekly review reminder | On | Prompt to complete your weekly review on Fridays |
| Monthly review reminder | On | Prompt to complete your monthly review |
| Import reminder | Off | Alert if no trades imported this week |
| Tag mistakes reminder | On | Prompt to tag mistakes on untagged closed trades |
| Playbook notes reminder | Off | Remind to update playbook notes after similar trades |

Toggle any switch and click **Save preferences**. Preferences are stored locally and will activate once the email notification system launches.

---

## Quick Reference — Navigation

| Page | URL | Purpose |
|---|---|---|
| Dashboard | `/dashboard` | Performance overview |
| Journal | `/journal` | All trades table |
| New Trade | `/journal/new` | Add trade manually |
| Analytics | `/analytics` | Deep stats & charts |
| Import | `/import` | Broker sync or CSV upload |
| Playbooks | `/playbooks` | Strategy library |
| Mistakes | `/mistakes` | Error frequency analysis |
| Calendar | `/calendar` | Daily P&L calendar |
| Weekly Review | `/reviews/weekly` | Weekly reflection |
| Monthly Review | `/reviews/monthly` | Monthly reflection |
| Notes | `/notes` | Market notes |
| Replay | `/replay` | Trade screenshot replay |
| Backtest | `/backtest` | Simulated trade journal |
| Settings | `/settings` | Profile, accounts, tags, MT5 |
| Billing | `/settings/billing` | Plan & pricing |
| Notifications | `/settings/notifications` | Reminder preferences |

---

## Tips for Getting the Most Out of TradeForge

1. **Tag every trade** — setup tags and mistake tags unlock the most powerful analytics. Untagged trades are just numbers.

2. **Upload at least one screenshot per trade** — even a single entry screenshot enables the replay feature and forces you to review your decision-making.

3. **Score every trade** — execution, discipline, and confidence scores reveal psychological patterns that pure P&L misses.

4. **Write a post-trade review** — even one sentence. Over time this becomes your most valuable trading asset.

5. **Do the weekly review** — traders who complete weekly reviews improve faster. The data is already there — you just need to reflect on it.

6. **Use the calendar** — red Wednesdays every week? That's a pattern worth investigating.

7. **Connect MT5 auto-sync** — remove friction from journaling. When trades appear automatically, you spend time reviewing instead of data entry.

8. **Build playbooks before trading** — define what a valid setup looks like before you see it on a chart. Use the checklist feature during live sessions.

---

*TradeForge — Forge Your Edge*
