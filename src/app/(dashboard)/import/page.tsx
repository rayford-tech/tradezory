import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { ImportPageClient } from "@/components/import/ImportPageClient";

export const dynamic = "force-dynamic";

export default async function ImportPage() {
  const session = await auth();
  const userId = session!.user!.id;

  const [accounts, brokerConnections] = await Promise.all([
    db.tradingAccount.findMany({
      where: { userId },
      orderBy: { isDefault: "desc" },
    }),
    db.brokerConnection.findMany({
      where: { userId },
      include: { tradingAccount: { select: { id: true, name: true, type: true } } },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const safeConnections = brokerConnections.map(({ encryptedPassword: _, ...c }) => c);

  return (
    <ImportPageClient
      accounts={accounts}
      brokerConnections={safeConnections}
    />
  );
}
