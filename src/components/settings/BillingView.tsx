"use client";

import { useState } from "react";
import { Check, Zap, Loader2 } from "lucide-react";

interface BillingViewProps {
  currentPlan: string;
  subscriptionStatus: string | null;
  currentPeriodEnd: string | null;
}

const PLANS = [
  {
    name: "Free",
    price: "$0",
    period: "",
    description: "Get started with the essentials",
    priceId: null,
    features: [
      "Up to 50 trades/month",
      "Basic journal table",
      "Core analytics (win rate, P&L)",
      "1 trading account",
      "CSV import (up to 100 rows)",
    ],
    missing: ["MT5 EA integration", "Playbooks", "Advanced analytics", "Trade replay", "Priority support"],
  },
  {
    name: "Starter",
    price: "$9",
    period: "/mo",
    description: "For consistent retail traders",
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_STARTER,
    features: [
      "Unlimited trades",
      "Up to 3 trading accounts",
      "CSV & MT5 EA import",
      "Full analytics suite",
      "Playbooks & mistake tracker",
      "Trade calendar & reviews",
      "Screenshot uploads (2 GB)",
    ],
    missing: ["MetaApi live sync", "AI insights", "Priority support"],
  },
  {
    name: "Pro",
    price: "$19",
    period: "/mo",
    description: "For serious and funded traders",
    popular: true,
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO,
    features: [
      "Everything in Starter",
      "Unlimited trading accounts",
      "MetaApi live sync",
      "Advanced drawdown analytics",
      "Trade replay with candle playback",
      "Backtesting module",
      "Screenshot uploads (20 GB)",
      "Email weekly review digest",
    ],
    missing: [],
  },
  {
    name: "Elite",
    price: "$39",
    period: "/mo",
    description: "For prop firm & professional traders",
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ELITE,
    features: [
      "Everything in Pro",
      "AI trade quality scoring",
      "AI psychology analysis",
      "AI weekly review summaries",
      "Setup pattern detection",
      "Performance coaching insights",
      "Unlimited screenshot storage",
      "Priority email support",
      "Early access to new features",
    ],
    missing: [],
  },
];

export function BillingView({ currentPlan, subscriptionStatus, currentPeriodEnd }: BillingViewProps) {
  const [loading, setLoading] = useState<string | null>(null);

  async function handleCheckout(priceId: string, planName: string) {
    setLoading(planName);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else alert(data.error ?? "Failed to create checkout session");
    } catch {
      alert("Something went wrong");
    } finally {
      setLoading(null);
    }
  }

  async function handlePortal() {
    setLoading("portal");
    try {
      const res = await fetch("/api/billing/portal", { method: "POST" });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else alert(data.error ?? "Failed to open billing portal");
    } catch {
      alert("Something went wrong");
    } finally {
      setLoading(null);
    }
  }

  const isPaid = currentPlan !== "FREE";
  const periodEndDate = currentPeriodEnd ? new Date(currentPeriodEnd).toLocaleDateString() : null;

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-xl font-bold text-zinc-50">Billing & Plans</h1>
        <p className="text-sm text-zinc-400 mt-1">
          You are on the <span className="text-indigo-400 font-medium">{currentPlan}</span> plan.
          {subscriptionStatus && subscriptionStatus !== "active" && (
            <span className="ml-2 text-amber-400">({subscriptionStatus})</span>
          )}
        </p>
      </div>

      {isPaid && (
        <div className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900/60 px-5 py-4">
          <div>
            <p className="text-sm font-medium text-zinc-100">Active subscription</p>
            {periodEndDate && (
              <p className="text-xs text-zinc-400 mt-0.5">
                {subscriptionStatus === "canceled" ? "Access until" : "Renews on"} {periodEndDate}
              </p>
            )}
          </div>
          <button
            onClick={handlePortal}
            disabled={loading === "portal"}
            className="flex items-center gap-2 rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800 transition-colors disabled:opacity-50"
          >
            {loading === "portal" && <Loader2 className="h-3 w-3 animate-spin" />}
            Manage Subscription
          </button>
        </div>
      )}

      {!isPaid && (
        <div className="flex items-center gap-3 rounded-xl border border-indigo-500/20 bg-indigo-500/5 px-5 py-4">
          <Zap className="h-4 w-4 text-indigo-400 shrink-0" />
          <p className="text-sm text-indigo-300">
            Upgrade to unlock unlimited trades, MetaApi sync, AI insights, and more.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {PLANS.map((plan) => {
          const isActive = currentPlan === plan.name.toUpperCase();
          const isLoadingThis = loading === plan.name;

          return (
            <div
              key={plan.name}
              className={`relative rounded-xl border p-5 flex flex-col gap-4 ${
                plan.popular ? "border-violet-500/40 bg-violet-500/5" : "border-zinc-800 bg-zinc-900/60"
              } ${isActive ? "ring-2 ring-indigo-500/50" : ""}`}
            >
              {plan.popular && (
                <div className="absolute -top-2.5 left-1/2 -translate-x-1/2">
                  <span className="rounded-full bg-violet-600 px-3 py-0.5 text-[10px] font-semibold text-white tracking-wide">
                    MOST POPULAR
                  </span>
                </div>
              )}
              {isActive && (
                <div className="absolute -top-2.5 right-3">
                  <span className="rounded-full bg-indigo-600 px-3 py-0.5 text-[10px] font-semibold text-white">
                    CURRENT
                  </span>
                </div>
              )}

              <div>
                <p className="text-sm font-bold text-zinc-100">{plan.name}</p>
                <p className="text-xs text-zinc-500 mt-0.5">{plan.description}</p>
                <div className="mt-3 flex items-baseline gap-0.5">
                  <span className="text-2xl font-bold text-zinc-50">{plan.price}</span>
                  <span className="text-xs text-zinc-500">{plan.period}</span>
                </div>
              </div>

              <ul className="space-y-1.5 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-xs text-zinc-300">
                    <Check className="h-3 w-3 text-emerald-400 mt-0.5 shrink-0" />
                    {f}
                  </li>
                ))}
                {plan.missing.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-xs text-zinc-600 line-through">
                    <span className="h-3 w-3 mt-0.5 shrink-0 text-center">–</span>
                    {f}
                  </li>
                ))}
              </ul>

              {isActive ? (
                <button
                  disabled
                  className="w-full rounded-lg py-2 text-sm font-medium bg-zinc-700 text-zinc-400 cursor-default"
                >
                  Current plan
                </button>
              ) : plan.name === "Free" ? (
                <button
                  onClick={handlePortal}
                  disabled={!isPaid || loading === "portal"}
                  className="w-full rounded-lg py-2 text-sm font-medium border border-zinc-700 text-zinc-400 hover:bg-zinc-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Downgrade
                </button>
              ) : (
                <button
                  onClick={() => plan.priceId && handleCheckout(plan.priceId, plan.name)}
                  disabled={!plan.priceId || isLoadingThis || loading !== null}
                  className="w-full rounded-lg py-2 text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isLoadingThis && <Loader2 className="h-3 w-3 animate-spin" />}
                  {isPaid ? "Switch plan" : "Upgrade"}
                </button>
              )}
            </div>
          );
        })}
      </div>

      <p className="text-xs text-zinc-600 text-center">
        All prices in USD. Cancel anytime. No hidden fees. Your data is always yours.
      </p>
    </div>
  );
}
