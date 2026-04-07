import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Users, TrendingUp, DollarSign, Activity } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const session = await auth();

  const [totalUsers, totalTrades, planCounts, recentSignals] = await Promise.all([
    db.user.count(),
    db.trade.count(),
    db.user.groupBy({ by: ["plan"], _count: true }),
    db.copySignal.count({ where: { status: "PENDING" } }),
  ]);

  const mrrEstimate =
    planCounts.reduce((sum, p) => {
      const price = p.plan === "STARTER" ? 9 : p.plan === "PRO" ? 19 : p.plan === "ELITE" ? 39 : 0;
      return sum + price * p._count;
    }, 0);

  const stats = [
    { label: "Total Users", value: totalUsers, icon: Users, color: "text-indigo-400" },
    { label: "Total Trades", value: totalTrades.toLocaleString(), icon: TrendingUp, color: "text-emerald-400" },
    { label: "Est. MRR", value: `$${mrrEstimate}`, icon: DollarSign, color: "text-amber-400" },
    { label: "Pending Signals", value: recentSignals, icon: Activity, color: "text-violet-400" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-bold text-zinc-50">Admin Overview</h1>
        <p className="text-sm text-zinc-400 mt-1">Platform-wide metrics</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5">
            <div className="flex items-center gap-2 mb-3">
              <s.icon className={`h-4 w-4 ${s.color}`} />
              <span className="text-xs text-zinc-400">{s.label}</span>
            </div>
            <p className="text-2xl font-bold text-zinc-50">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5">
        <h2 className="text-sm font-semibold text-zinc-300 mb-4">Plan Distribution</h2>
        <div className="space-y-2">
          {planCounts.map((p) => (
            <div key={p.plan} className="flex items-center justify-between text-sm">
              <span className="text-zinc-400">{p.plan}</span>
              <span className="font-medium text-zinc-200">{p._count} users</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
