//+------------------------------------------------------------------+
//|                                               Tradezory_EA.mq5   |
//|                                Tradezory Trading Journal Platform |
//|                                    https://tradezory.com          |
//+------------------------------------------------------------------+
//
// INSTALLATION:
// 1. Copy this file to: MT5_DATA_FOLDER\MQL5\Experts\Tradezory_EA.mq5
// 2. In MT5: Tools → Options → Expert Advisors → Allow WebRequests
//    Add your Tradezory URL (e.g. https://yourapp.com)
// 3. Compile (F7) and drag onto any chart
// 4. Set the input parameters below
//
//+------------------------------------------------------------------+

#property copyright "Tradezory"
#property link      "https://tradezory.com"
#property version   "1.10"

#include <Trade\Trade.mqh>

input string   WebhookURL           = "https://your-tradezory-url.com/api/mt5/webhook";
input string   AccountID            = "your-trading-account-id";   // Trading account ID from Tradezory settings
input string   HMACSecret           = "your-mt5-webhook-secret";   // Must match MT5_WEBHOOK_SECRET in .env
input bool     SendOnOpen           = true;    // Send webhook when trade opens
input bool     SendOnClose          = true;    // Send webhook when trade closes
input bool     SendOnModify         = false;   // Send webhook when SL/TP modified
input int      HttpTimeout          = 5000;    // Request timeout (ms)
input bool     SendHistoricalOnInit = true;    // Sync past closed trades on EA start
input datetime HistoricalSyncFrom   = 0;       // Backfill start date (0 = all history)

//+------------------------------------------------------------------+
//| Compute signature: "<secret>|<timestamp>"                         |
//+------------------------------------------------------------------+
// NOTE: MQL5 does not have native HMAC-SHA256.
// Uses a timestamp-based token matching the server's verifySignature().
string ComputeSignature(string body, string secret)
{
   long ts = TimeCurrent();
   string token = secret + "|" + IntegerToString(ts);
   return token;
}

//+------------------------------------------------------------------+
//| Build JSON payload from a deal ticket                             |
//+------------------------------------------------------------------+
string BuildPayload(ulong ticket, bool isClose)
{
   HistoryDealSelect(ticket);

   string symbol     = HistoryDealGetString(ticket, DEAL_SYMBOL);
   int    dealType   = (int)HistoryDealGetInteger(ticket, DEAL_TYPE);
   double volume     = HistoryDealGetDouble(ticket, DEAL_VOLUME);
   double price      = HistoryDealGetDouble(ticket, DEAL_PRICE);
   double profit     = HistoryDealGetDouble(ticket, DEAL_PROFIT);
   double commission = HistoryDealGetDouble(ticket, DEAL_COMMISSION);
   double swap       = HistoryDealGetDouble(ticket, DEAL_SWAP);
   string comment    = HistoryDealGetString(ticket, DEAL_COMMENT);
   datetime time     = (datetime)HistoryDealGetInteger(ticket, DEAL_TIME);

   string direction = (dealType == DEAL_TYPE_BUY) ? "BUY" : "SELL";

   // Attempt to get SL/TP from the associated position
   ulong posId = HistoryDealGetInteger(ticket, DEAL_POSITION_ID);
   double sl = 0, tp = 0;
   if(PositionSelectByTicket(posId))
   {
      sl = PositionGetDouble(POSITION_SL);
      tp = PositionGetDouble(POSITION_TP);
   }

   string timeStr    = TimeToString(time, TIME_DATE|TIME_SECONDS);
   string closeTimeStr = isClose ? timeStr : "";

   string json = StringFormat(
      "{\"ticket\":%d,\"symbol\":\"%s\",\"type\":\"%s\","
      "\"volume\":%.2f,\"openPrice\":%.5f,\"sl\":%.5f,\"tp\":%.5f,"
      "\"openTime\":\"%s\",\"closeTime\":\"%s\","
      "\"profit\":%.2f,\"commission\":%.2f,\"swap\":%.2f,"
      "\"comment\":\"%s\"}",
      (int)ticket, symbol, direction,
      volume, price, sl, tp,
      timeStr, closeTimeStr,
      profit, commission, swap, comment
   );

   return json;
}

//+------------------------------------------------------------------+
//| Send HTTP POST to Tradezory webhook                               |
//+------------------------------------------------------------------+
bool SendWebhook(string payload)
{
   string sig = ComputeSignature(payload, HMACSecret);

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
      int err = GetLastError();
      Print("Tradezory webhook error: ", err, " — Check WebRequests URL is whitelisted");
      return false;
   }

   if(res != 200 && res != 201)
   {
      Print("Tradezory webhook returned HTTP ", res, " for ticket");
      return false;
   }

   return true;
}

//+------------------------------------------------------------------+
//| Backfill historical closed deals on EA startup                    |
//+------------------------------------------------------------------+
void SyncHistoricalDeals()
{
   datetime fromTime = (HistoricalSyncFrom > 0) ? HistoricalSyncFrom : 0;
   datetime toTime   = TimeCurrent();

   if(!HistorySelect(fromTime, toTime))
   {
      Print("Tradezory: Failed to load deal history for backfill");
      return;
   }

   int total = HistoryDealsTotal();
   Print("Tradezory: Starting historical backfill — ", total, " deals found in history");

   int sent = 0;
   int skipped = 0;

   for(int i = 0; i < total; i++)
   {
      ulong ticket = HistoryDealGetTicket(i);
      if(ticket == 0) { skipped++; continue; }

      // Only process regular trade deals (not balance, credit, etc.)
      long dealType = HistoryDealGetInteger(ticket, DEAL_TYPE);
      if(dealType != DEAL_TYPE_BUY && dealType != DEAL_TYPE_SELL) { skipped++; continue; }

      long dealEntry = HistoryDealGetInteger(ticket, DEAL_ENTRY);
      bool isOpen  = (dealEntry == DEAL_ENTRY_IN);
      bool isClose = (dealEntry == DEAL_ENTRY_OUT || dealEntry == DEAL_ENTRY_INOUT);

      if(!isOpen && !isClose) { skipped++; continue; }

      if((isOpen && SendOnOpen) || (isClose && SendOnClose))
      {
         if(SendWebhook(BuildPayload(ticket, isClose)))
            sent++;
         else
            skipped++;

         // Pace requests to avoid server overload (50ms between sends)
         Sleep(50);
      }
   }

   Print("Tradezory: Historical backfill complete — sent: ", sent, ", skipped: ", skipped);
}

//+------------------------------------------------------------------+
//| Trade event handler (real-time sync)                              |
//+------------------------------------------------------------------+
void OnTrade()
{
   if(!HistorySelect(TimeCurrent() - 60, TimeCurrent() + 60))
      return;

   int totalDeals = HistoryDealsTotal();
   for(int i = totalDeals - 1; i >= MathMax(0, totalDeals - 5); i--)
   {
      ulong ticket = HistoryDealGetTicket(i);
      if(ticket == 0) continue;

      long entry = HistoryDealGetInteger(ticket, DEAL_ENTRY);
      long time  = HistoryDealGetInteger(ticket, DEAL_TIME);

      // Only process recent deals (last 10 seconds)
      if(TimeCurrent() - (datetime)time > 10) continue;

      bool isOpen  = (entry == DEAL_ENTRY_IN);
      bool isClose = (entry == DEAL_ENTRY_OUT || entry == DEAL_ENTRY_INOUT);

      if((isOpen && SendOnOpen) || (isClose && SendOnClose))
      {
         SendWebhook(BuildPayload(ticket, isClose));
      }
   }
}

//+------------------------------------------------------------------+
//| Expert initialization                                             |
//+------------------------------------------------------------------+
int OnInit()
{
   Print("Tradezory EA v1.10 initialized. Webhook: ", WebhookURL);
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
