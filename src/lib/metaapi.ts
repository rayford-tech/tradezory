/**
 * MetaApi REST integration for MT4/MT5 broker sync.
 * Docs: https://metaapi.cloud/docs/client/
 *
 * Requires env: METAAPI_TOKEN
 * Get a free token at https://app.metaapi.cloud
 */

const BASE = "https://mt-provisioning-api-v1.agiliumtrade.agiliumtrade.ai";
const HISTORY_BASE = "https://mt-client-api-v1.agiliumtrade.agiliumtrade.ai";

function token(): string {
  const t = process.env.METAAPI_TOKEN;
  if (!t) throw new Error("METAAPI_TOKEN not configured");
  return t;
}

export interface MetaApiAccountSpec {
  name: string;           // display name
  server: string;         // broker server e.g. "ICMarkets-Live01"
  login: string;          // account number
  password: string;       // investor (read-only) password
  platform: "mt4" | "mt5";
  magic?: number;
}

export interface MetaApiDeal {
  id: string;
  orderId: string;
  positionId: string;
  time: string;           // ISO timestamp
  brokerTime: string;
  commission: number;
  swap: number;
  profit: number;
  symbol: string;
  comment: string;
  clientId: string;
  platform: string;
  type: string;           // "DEAL_TYPE_BUY" | "DEAL_TYPE_SELL" | "DEAL_TYPE_BALANCE" etc.
  entryType: string;      // "DEAL_ENTRY_IN" | "DEAL_ENTRY_OUT"
  volume: number;
  price: number;
  stopLoss?: number;
  takeProfit?: number;
}

export interface MetaApiPosition {
  id: string;
  platform: string;
  time: string;
  updateTime: string;
  symbol: string;
  type: string;           // "POSITION_TYPE_BUY" | "POSITION_TYPE_SELL"
  volume: number;
  openPrice: number;
  stopLoss?: number;
  takeProfit?: number;
  profit: number;
  swap: number;
  commission: number;
}

/** Provision a new MetaApi account and return its ID */
export async function provisionAccount(spec: MetaApiAccountSpec): Promise<string> {
  const res = await fetch(`${BASE}/users/current/accounts`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "auth-token": token(),
    },
    body: JSON.stringify({
      name: spec.name,
      server: spec.server,
      login: spec.login,
      password: spec.password,
      platform: spec.platform,
      magic: spec.magic ?? 0,
      type: "cloud-g2",
      region: "london",
      tags: ["tradeforge"],
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`MetaApi provision failed: ${res.status} ${JSON.stringify(err)}`);
  }

  const data = await res.json();
  return data.id as string;
}

/** Delete a provisioned MetaApi account */
export async function deprovisionAccount(metaApiAccountId: string): Promise<void> {
  await fetch(`${BASE}/users/current/accounts/${metaApiAccountId}`, {
    method: "DELETE",
    headers: { "auth-token": token() },
  });
}

/** Get account connection status */
export async function getAccountStatus(metaApiAccountId: string): Promise<{ state: string; connectionStatus: string }> {
  const res = await fetch(`${BASE}/users/current/accounts/${metaApiAccountId}`, {
    headers: { "auth-token": token() },
  });
  if (!res.ok) throw new Error(`MetaApi status check failed: ${res.status}`);
  const data = await res.json();
  return { state: data.state, connectionStatus: data.connectionStatus };
}

/** Pull closed deals from MetaApi (paginated) */
export async function getDeals(
  metaApiAccountId: string,
  fromDate?: string,
  toDate?: string
): Promise<MetaApiDeal[]> {
  const region = "london"; // should match account region
  const from = fromDate ?? new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString();
  const to = toDate ?? new Date().toISOString();

  const url = new URL(
    `${HISTORY_BASE}/users/current/accounts/${metaApiAccountId}/history-deals/time/${from}/${to}`
  );

  const res = await fetch(url.toString(), {
    headers: { "auth-token": token() },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`MetaApi deals fetch failed: ${res.status} ${JSON.stringify(err)}`);
  }

  const data = await res.json();
  return (data.deals ?? data) as MetaApiDeal[];
}

/** Pull open positions from MetaApi */
export async function getPositions(metaApiAccountId: string): Promise<MetaApiPosition[]> {
  const region = "london";
  const res = await fetch(
    `${HISTORY_BASE}/users/current/accounts/${metaApiAccountId}/positions`,
    { headers: { "auth-token": token() } }
  );
  if (!res.ok) throw new Error(`MetaApi positions fetch failed: ${res.status}`);
  const data = await res.json();
  return (data.positions ?? data) as MetaApiPosition[];
}

/** Map MetaApi deal type to our Direction */
export function mapDealDirection(type: string): "BUY" | "SELL" {
  return type.includes("BUY") ? "BUY" : "SELL";
}

/** Check if METAAPI_TOKEN is configured */
export function isMetaApiConfigured(): boolean {
  return !!process.env.METAAPI_TOKEN;
}
