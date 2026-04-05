import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Check, Zap } from "lucide-react";

interface Plan {
  name: string;
  price: string;
  period: string;
  description: string;
  popular?: boolean;
  features: string[];
  missing: string[];
}

const PLANS: Plan[] = [
  {
    name: "Free",
    price: "$0",
    period: "",
    description: "Get started with the essentials",
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
    missing: ["AI insights (coming Q3 2025)"],
  },
  {
    name: "Elite",
    price: "$39",
    period: "/mo",
    description: "For prop firm & professional traders",
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

export const dynamic = "force-dynamic";

export default async function BillingPage() {
  const session = await auth();
  const user = await db.user.findUnique({
    where: { id: session!.user!.id },
    select: { plan: true, email: true },
  });
  const currentPlan = user?.plan ?? "FREE";

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-xl font-bold text-zinc-50">Billing & Plans</h1>
        <p className="text-sm text-zinc-400 mt-1">
          You are on the <span className="text-indigo-400 font-medium">{currentPlan}</span> plan.
        </p>
      </div>

      {/* Stripe coming soon banner */}
      <div className="flex items-center gap-3 rounded-xl border border-amber-500/20 bg-amber-500/5 px-5 py-4">
        <Zap className="h-4 w-4 text-amber-400 shrink-0" />
        <div>
          <p className="text-sm font-medium text-amber-300">Stripe payments coming soon</p>
          <p className="text-xs text-zinc-400 mt-0.5">Billing infrastructure is being set up. Paid plans will be available shortly. Early users will receive a discount.</p>
        </div>
      </div>

      {/* Pricing cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {PLANS.map((plan) => {
          const isActive = currentPlan === plan.name.toUpperCase();
          return (
            <div
              key={plan.name}
              className={`relative rounded-xl border p-5 flex flex-col gap-4 ${
                plan.popular
                  ? "border-violet-500/40 bg-violet-500/5"
                  : "border-zinc-800 bg-zinc-900/60"
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

              <button
                disabled
                className={`w-full rounded-lg py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-zinc-700 text-zinc-400 cursor-default"
                    : plan.name === "Free"
                    ? "border border-zinc-700 text-zinc-400 cursor-not-allowed"
                    : "bg-indigo-600 text-white opacity-50 cursor-not-allowed"
                }`}
              >
                {isActive ? "Current plan" : plan.name === "Free" ? "Downgrade" : "Upgrade (soon)"}
              </button>
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
