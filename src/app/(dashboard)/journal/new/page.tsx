import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { TradeForm } from "@/components/journal/TradeForm";

export default async function NewTradePage() {
  const session = await auth();
  const userId = session!.user!.id;

  const [accounts, setupTags, mistakeTags] = await Promise.all([
    db.tradingAccount.findMany({ where: { userId }, orderBy: { isDefault: "desc" } }),
    db.setupTag.findMany({ where: { userId }, orderBy: { name: "asc" } }),
    db.mistakeTag.findMany({ where: { userId }, orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <div>
        <h1 className="text-xl font-bold text-zinc-50">Log Trade</h1>
        <p className="text-sm text-zinc-400">Record the details of your trade</p>
      </div>
      <TradeForm accounts={accounts} setupTags={setupTags} mistakeTags={mistakeTags} />
    </div>
  );
}
