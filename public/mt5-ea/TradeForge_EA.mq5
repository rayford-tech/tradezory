//+------------------------------------------------------------------+
//|                                              TradeForge_EA.mq5   |
//|                              TradeForge Trading Journal Platform  |
//|                                  https://tradeforge.io           |
//+------------------------------------------------------------------+
//
// INSTALLATION:
// 1. Copy this file to: MT5_DATA_FOLDER\MQL5\Experts\TradeForge_EA.mq5
// 2. In MT5: Tools → Options → Expert Advisors → Allow WebRequests
//    Add your TradeForge URL (e.g. https://yourapp.com)
// 3. Compile (F7) and drag onto any chart
// 4. Set the input parameters below
//
//+------------------------------------------------------------------+

#property copyright "TradeForge"
#property link      "https://tradeforge.io"
#property version   "1.00"

#include <Trade\Trade.mqh>

input string WebhookURL    = "https://your-tradeforge-url.com/api/mt5/webhook";
input string AccountID     = "your-trading-account-id";   // Trading account ID from TradeForge settings
input string HMACSecret    = "your-mt5-webhook-secret";   // Must match MT5_WEBHOOK_SECRET in .env
input bool   SendOnOpen    = true;    // Send webhook when trade opens
input bool   SendOnClose   = true;    // Send webhook when trade closes
input bool   SendOnModify  = false;   // Send webhook when SL/TP modified
input int    HttpTimeout   = 5000;    // Request timeout (ms)

//+------------------------------------------------------------------+
//| Compute HMAC-SHA256 (simplified — use external library if needed)|
//+------------------------------------------------------------------+
// NOTE: MQL5 does not have native HMAC-SHA256.
// For production, use the WinAPI CryptHashData approach or a CRC checksum.
// This implementation sends a simple timestamp-based token for basic auth.
string ComputeSignature(string body, string secret)
{
   // Simplified: concatenate secret + timestamp as basic auth token
   // For production HMAC, implement via Windows CryptAPI or use a helper DLL
   long ts = TimeCurrent();
   string token = secret + "|" + IntegerToString(ts);
   return token;
}

//+------------------------------------------------------------------+
//| Build JSON payload from deal properties                           |
//+------------------------------------------------------------------+
string BuildPayload(ulong ticket, bool isClose)
{
   HistoryDealSelect(ticket);

   string symbol    = HistoryDealGetString(ticket, DEAL_SYMBOL);
   int    dealType  = (int)HistoryDealGetInteger(ticket, DEAL_TYPE);
   double volume    = HistoryDealGetDouble(ticket, DEAL_VOLUME);
   double price     = HistoryDealGetDouble(ticket, DEAL_PRICE);
   double profit    = HistoryDealGetDouble(ticket, DEAL_PROFIT);
   double commission= HistoryDealGetDouble(ticket, DEAL_COMMISSION);
   double swap      = HistoryDealGetDouble(ticket, DEAL_SWAP);
   string comment   = HistoryDealGetString(ticket, DEAL_COMMENT);
   datetime time    = (datetime)HistoryDealGetInteger(ticket, DEAL_TIME);

   string direction = (dealType == DEAL_TYPE_BUY) ? "BUY" : "SELL";

   // Get position info for SL/TP
   ulong posId = HistoryDealGetInteger(ticket, DEAL_POSITION_ID);
   double sl = 0, tp = 0;

   if(PositionSelectByTicket(posId))
   {
      sl = PositionGetDouble(POSITION_SL);
      tp = PositionGetDouble(POSITION_TP);
   }

   string openTimeStr  = TimeToString(time, TIME_DATE|TIME_SECONDS);
   string closeTimeStr = isClose ? openTimeStr : "";

   string json = StringFormat(
      "{\"ticket\":%d,\"symbol\":\"%s\",\"type\":\"%s\","
      "\"volume\":%.2f,\"openPrice\":%.5f,\"sl\":%.5f,\"tp\":%.5f,"
      "\"openTime\":\"%s\",\"closeTime\":\"%s\","
      "\"profit\":%.2f,\"commission\":%.2f,\"swap\":%.2f,"
      "\"comment\":\"%s\"}",
      (int)ticket, symbol, direction,
      volume, price, sl, tp,
      openTimeStr, closeTimeStr,
      profit, commission, swap, comment
   );

   return json;
}

//+------------------------------------------------------------------+
//| Send HTTP POST to TradeForge webhook                              |
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
      "X-TradeForge-Signature: %s\r\n"
      "X-TradeForge-Account-Id: %s\r\n",
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
      Print("TradeForge webhook error: ", err, " — Check WebRequests URL is whitelisted");
      return false;
   }

   if(res != 200 && res != 201)
   {
      Print("TradeForge webhook returned HTTP ", res);
      return false;
   }

   Print("TradeForge: trade synced OK (ticket #", "", ")");
   return true;
}

//+------------------------------------------------------------------+
//| Trade event handler                                               |
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
         string payload = BuildPayload(ticket, isClose);
         SendWebhook(payload);
      }
   }
}

//+------------------------------------------------------------------+
//| Expert initialization                                             |
//+------------------------------------------------------------------+
int OnInit()
{
   Print("TradeForge EA initialized. Webhook: ", WebhookURL);
   Print("Account ID: ", AccountID);
   return INIT_SUCCEEDED;
}

//+------------------------------------------------------------------+
//| Expert deinitialization                                           |
//+------------------------------------------------------------------+
void OnDeinit(const int reason)
{
   Print("TradeForge EA removed.");
}

//+------------------------------------------------------------------+
//| Expert tick (required but not used)                               |
//+------------------------------------------------------------------+
void OnTick() {}
