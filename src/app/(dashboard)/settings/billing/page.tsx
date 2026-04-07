import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { BillingView } from "@/components/settings/BillingView";

export const dynamic = "force-dynamic";

export default async function BillingPage() {
  const session = await auth();
  const user = await db.user.findUnique({
    where: { id: session!.user!.id },
    select: { plan: true, subscriptionStatus: true, currentPeriodEnd: true },
  });

  return (
    <BillingView
      currentPlan={user?.plan ?? "FREE"}
      subscriptionStatus={user?.subscriptionStatus ?? null}
      currentPeriodEnd={user?.currentPeriodEnd?.toISOString() ?? null}
    />
  );
}
