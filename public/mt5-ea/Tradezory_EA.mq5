//+------------------------------------------------------------------+
//|                                               Tradezory_EA.mq5   |
//|                                Tradezory Trading Journal Platform |
//|                                    https://tradezory.com          |
//+------------------------------------------------------------------+
//
// INSTALLATION:
// 1. Copy this file to: <MT5 data folder>\MQL5\Experts\
//    (In MT5: File → Open Data Folder → MQL5 → Experts)
// 2. Open MetaEditor: press F4 in MT5 (or Tools → MetaQuotes Language Editor)
//    File → Open → select Tradezory_EA.mq5 → press F7 to Compile
//    Wait for "0 errors" in the Toolbox at the bottom before continuing.
// 3. Back in MT5: View → Navigator (Ctrl+N) → right-click Expert Advisors → Refresh
//    "Tradezory_EA" should now appear in the list.
// 4. Enable WebRequests: Tools → Options → Expert Advisors → Allow WebRequest for listed URL
//    Add your Tradezory URL (e.g. https://tradezory.com)
// 5. Drag Tradezory_EA from Navigator onto ONE chart, fill in the inputs below, click OK.
//
// HISTORICAL BACKFILL:
// Set SendHistoricalOnInit = true, attach to ONE chart, wait for completion,
// then set back to false to avoid re-sending on restarts.
//
//+------------------------------------------------------------------+

#property copyright "Tradezory"
#property link      "https://tradezory.com"
#property version   "2.00"

#include <Trade\Trade.mqh>

input string   WebhookURL           = "https://your-tradezory-url.com/api/mt5/webhook";
input string   AccountID            = "your-trading-account-id";
input string   HMACSecret           = "your-mt5-webhook-secret";
input bool     SendOnOpen           = true;
input bool     SendOnClose          = true;
input int      HttpTimeout          = 5000;
input bool     SendHistoricalOnInit = false;  // Set true ONCE to backfill, then back to false
input datetime HistoricalSyncFrom   = 0;      // 0 = all history

//+------------------------------------------------------------------+
//| Compute signature: "<secret>|<timestamp>"                         |
//+------------------------------------------------------------------+
string ComputeSignature(string secret)
{
   long ts = TimeCurrent();
   return secret + "|" + IntegerToString(ts);
}

//+------------------------------------------------------------------+
//| Find the opening deal for a position (DEAL_ENTRY_IN)              |
//| Returns false if not found.                                       |
//+------------------------------------------------------------------+
bool FindEntryDeal(ulong posId,
                   ulong  &outTicket,
                   string &outDirection,
                   double &outPrice,
                   string &outTimeStr)
{
   int total = HistoryDealsTotal();
   for(int i = 0; i < total; i++)
   {
      ulong t = HistoryDealGetTicket(i);
      if(t == 0) continue;
      if((ulong)HistoryDealGetInteger(t, DEAL_POSITION_ID) != posId) continue;
      if(HistoryDealGetInteger(t, DEAL_ENTRY) != DEAL_ENTRY_IN) continue;

      long dt = HistoryDealGetInteger(t, DEAL_TYPE);
      if(dt != DEAL_TYPE_BUY && dt != DEAL_TYPE_SELL) continue;

      outTicket    = t;
      outDirection = (dt == DEAL_TYPE_BUY) ? "BUY" : "SELL";
      outPrice     = HistoryDealGetDouble(t, DEAL_PRICE);
      datetime et  = (datetime)HistoryDealGetInteger(t, DEAL_TIME);
      outTimeStr   = TimeToString(et, TIME_DATE|TIME_SECONDS);
      return true;
   }
   return false;
}

//+------------------------------------------------------------------+
//| Build JSON for an OPENING deal                                    |
//+------------------------------------------------------------------+
string BuildOpenPayload(ulong posId, ulong ticket)
{
   HistoryDealSelect(ticket);

   string symbol    = HistoryDealGetString(ticket, DEAL_SYMBOL);
   int    dealType  = (int)HistoryDealGetInteger(ticket, DEAL_TYPE);
   double volume    = HistoryDealGetDouble(ticket, DEAL_VOLUME);
   double price     = HistoryDealGetDouble(ticket, DEAL_PRICE);
   datetime time    = (datetime)HistoryDealGetInteger(ticket, DEAL_TIME);
   string comment   = HistoryDealGetString(ticket, DEAL_COMMENT);

   string direction = (dealType == DEAL_TYPE_BUY) ? "BUY" : "SELL";
   string openTimeStr = TimeToString(time, TIME_DATE|TIME_SECONDS);

   // SL/TP available from the active position
   double sl = 0, tp = 0;
   if(PositionSelectByTicket(posId))
   {
      sl = PositionGetDouble(POSITION_SL);
      tp = PositionGetDouble(POSITION_TP);
   }

   return StringFormat(
      "{\"ticket\":%I64u,\"symbol\":\"%s\",\"type\":\"%s\","
      "\"volume\":%.2f,\"openPrice\":%.5f,\"sl\":%.5f,\"tp\":%.5f,"
      "\"openTime\":\"%s\",\"closeTime\":\"\","
      "\"profit\":0,\"commission\":0,\"swap\":0,\"comment\":\"%s\"}",
      posId, symbol, direction,
      volume, price, sl, tp,
      openTimeStr, comment
   );
}

//+------------------------------------------------------------------+
//| Build JSON for a CLOSING deal (complete trade with entry+exit)    |
//+------------------------------------------------------------------+
string BuildClosePayload(ulong posId, ulong closeTicket)
{
   HistoryDealSelect(closeTicket);

   string symbol     = HistoryDealGetString(closeTicket, DEAL_SYMBOL);
   int    closeType  = (int)HistoryDealGetInteger(closeTicket, DEAL_TYPE);
   double volume     = HistoryDealGetDouble(closeTicket, DEAL_VOLUME);
   double closePrice = HistoryDealGetDouble(closeTicket, DEAL_PRICE);
   datetime closeTime= (datetime)HistoryDealGetInteger(closeTicket, DEAL_TIME);
   double profit     = HistoryDealGetDouble(closeTicket, DEAL_PROFIT);
   double commission = HistoryDealGetDouble(closeTicket, DEAL_COMMISSION);
   double swap       = HistoryDealGetDouble(closeTicket, DEAL_SWAP);
   string comment    = HistoryDealGetString(closeTicket, DEAL_COMMENT);

   // Position direction is the OPPOSITE of the closing deal type:
   // closing BUY deal = was a SELL position; closing SELL deal = was a BUY position
   string direction = (closeType == DEAL_TYPE_BUY) ? "SELL" : "BUY";
   string closeTimeStr = TimeToString(closeTime, TIME_DATE|TIME_SECONDS);

   // Find matching entry deal for entry price, time, and SL/TP
   ulong  entryTicket = 0;
   string entryDirection = direction;
   double entryPrice  = closePrice;  // fallback
   string entryTimeStr = closeTimeStr; // fallback
   double sl = 0, tp = 0;

   if(FindEntryDeal(posId, entryTicket, entryDirection, entryPrice, entryTimeStr))
   {
      direction = entryDirection; // use direction from entry deal (more reliable)
      HistoryDealSelect(entryTicket);
      // Try to retrieve SL/TP stored in entry deal's position snapshot via magic/comment
      // (position is closed, PositionSelectByTicket won't work)
      HistoryDealSelect(closeTicket); // restore context to close deal
   }

   return StringFormat(
      "{\"ticket\":%I64u,\"symbol\":\"%s\",\"type\":\"%s\","
      "\"volume\":%.2f,\"openPrice\":%.5f,\"closePrice\":%.5f,\"sl\":%.5f,\"tp\":%.5f,"
      "\"openTime\":\"%s\",\"closeTime\":\"%s\","
      "\"profit\":%.2f,\"commission\":%.2f,\"swap\":%.2f,\"comment\":\"%s\"}",
      posId, symbol, direction,
      volume, entryPrice, closePrice, sl, tp,
      entryTimeStr, closeTimeStr,
      profit, commission, swap, comment
   );
}

//+------------------------------------------------------------------+
//| Send HTTP POST to Tradezory webhook                               |
//+------------------------------------------------------------------+
bool SendWebhook(string payload)
{
   string sig = ComputeSignature(HMACSecret);

   char   postData[];
   char   result[];
   string resultHeaders;

   StringToCharArray(payload, postData, 0, StringLen(payload));

   string headers = StringFormat(
      "Content-Type: application/json\r\n"
      "X-Tradezory-Signature: %s\r\n"
      "X-Tradezory-Account-Id: %s\r\n",
      sig, AccountID
   );

   int res = WebRequest(
      "POST",
      WebhookURL,
      headers,
      HttpTimeout,
      postData,
      result,
      resultHeaders
   );

   if(res == -1)
   {
      Print("Tradezory webhook error: ", GetLastError(), " — Check WebRequests URL is whitelisted");
      return false;
   }
   if(res != 200 && res != 201)
   {
      Print("Tradezory webhook HTTP ", res);
      return false;
   }
   return true;
}

//+------------------------------------------------------------------+
//| Backfill historical closed positions on startup                   |
//+------------------------------------------------------------------+
void SyncHistoricalDeals()
{
   datetime fromTime = (HistoricalSyncFrom > 0) ? HistoricalSyncFrom : 0;
   if(!HistorySelect(fromTime, TimeCurrent()))
   {
      Print("Tradezory: Failed to load deal history");
      return;
   }

   int total = HistoryDealsTotal();
   Print("Tradezory: Starting historical backfill — ", total, " deals in history");

   int sent = 0, skipped = 0;

   for(int i = 0; i < total; i++)
   {
      ulong ticket = HistoryDealGetTicket(i);
      if(ticket == 0) { skipped++; continue; }

      long dealType  = HistoryDealGetInteger(ticket, DEAL_TYPE);
      if(dealType != DEAL_TYPE_BUY && dealType != DEAL_TYPE_SELL) { skipped++; continue; }

      long dealEntry = HistoryDealGetInteger(ticket, DEAL_ENTRY);
      ulong posId    = (ulong)HistoryDealGetInteger(ticket, DEAL_POSITION_ID);

      if(dealEntry == DEAL_ENTRY_OUT || dealEntry == DEAL_ENTRY_INOUT)
      {
         // Send complete closed trade (entry+exit) using position ID as ticket
         if(SendOnClose && SendWebhook(BuildClosePayload(posId, ticket)))
            sent++;
         else
            skipped++;
         Sleep(80);
      }
      else if(dealEntry == DEAL_ENTRY_IN)
      {
         // Only send open entries if there is NO corresponding close deal yet
         // (i.e. the position is still open)
         bool hasClose = false;
         for(int j = i + 1; j < total; j++)
         {
            ulong t2 = HistoryDealGetTicket(j);
            if(t2 == 0) continue;
            if((ulong)HistoryDealGetInteger(t2, DEAL_POSITION_ID) != posId) continue;
            long e2 = HistoryDealGetInteger(t2, DEAL_ENTRY);
            if(e2 == DEAL_ENTRY_OUT || e2 == DEAL_ENTRY_INOUT) { hasClose = true; break; }
         }
         if(!hasClose && SendOnOpen)
         {
            if(SendWebhook(BuildOpenPayload(posId, ticket))) sent++;
            else skipped++;
            Sleep(80);
         }
      }
   }

   Print("Tradezory: Backfill complete — sent: ", sent, ", skipped: ", skipped);
}

//+------------------------------------------------------------------+
//| Trade event handler (real-time)                                   |
//+------------------------------------------------------------------+
void OnTrade()
{
   if(!HistorySelect(TimeCurrent() - 120, TimeCurrent() + 5))
      return;

   int totalDeals = HistoryDealsTotal();
   for(int i = totalDeals - 1; i >= MathMax(0, totalDeals - 50); i--)
   {
      ulong ticket = HistoryDealGetTicket(i);
      if(ticket == 0) continue;

      long   entry   = HistoryDealGetInteger(ticket, DEAL_ENTRY);
      long   time    = HistoryDealGetInteger(ticket, DEAL_TIME);
      long   dealType= HistoryDealGetInteger(ticket, DEAL_TYPE);
      ulong  posId   = (ulong)HistoryDealGetInteger(ticket, DEAL_POSITION_ID);

      if(dealType != DEAL_TYPE_BUY && dealType != DEAL_TYPE_SELL) continue;

      // Only process recent deals (last 30 seconds)
      if(TimeCurrent() - (datetime)time > 30) continue;

      bool isOpen  = (entry == DEAL_ENTRY_IN);
      bool isClose = (entry == DEAL_ENTRY_OUT || entry == DEAL_ENTRY_INOUT);

      if(isOpen && SendOnOpen)
         SendWebhook(BuildOpenPayload(posId, ticket));
      else if(isClose && SendOnClose)
      {
         // Need full history to find entry deal — expand window
         HistorySelect(0, TimeCurrent());
         SendWebhook(BuildClosePayload(posId, ticket));
         // Restore recent window for rest of loop
         HistorySelect(TimeCurrent() - 60, TimeCurrent() + 60);
      }
   }
}

//+------------------------------------------------------------------+
//| Expert initialization                                             |
//+------------------------------------------------------------------+
int OnInit()
{
   Print("Tradezory EA v2.00 initialized. Webhook: ", WebhookURL);
   Print("Account ID: ", AccountID);

   if(SendHistoricalOnInit)
      SyncHistoricalDeals();

   return INIT_SUCCEEDED;
}

//+------------------------------------------------------------------+
//| Expert deinitialization                                           |
//+------------------------------------------------------------------+
void OnDeinit(const int reason)
{
   Print("Tradezory EA removed.");
}

//+------------------------------------------------------------------+
//| Expert tick (required but not used)                               |
//+------------------------------------------------------------------+
void OnTick() {}
