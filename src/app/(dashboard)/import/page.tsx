import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { ImportView } from "@/components/import/ImportView";

export const dynamic = "force-dynamic";

export default async function ImportPage() {
  const session = await auth();
  const userId = session!.user!.id;

  const accounts = await db.tradingAccount.findMany({
    where: { userId },
    orderBy: { isDefault: "desc" },
  });

  return <ImportView accounts={accounts} />;
}
