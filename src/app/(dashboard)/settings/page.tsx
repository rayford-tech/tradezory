import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { SettingsView } from "@/components/settings/SettingsView";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const session = await auth();
  const userId = session!.user!.id;

  const [user, accounts, setupTags, mistakeTags] = await Promise.all([
    db.user.findUnique({ where: { id: userId } }),
    db.tradingAccount.findMany({ where: { userId }, orderBy: { isDefault: "desc" } }),
    db.setupTag.findMany({ where: { userId }, orderBy: { name: "asc" } }),
    db.mistakeTag.findMany({ where: { userId }, orderBy: { name: "asc" } }),
  ]);

  return (
    <SettingsView
      user={user!}
      accounts={accounts}
      setupTags={setupTags}
      mistakeTags={mistakeTags}
    />
  );
}
