import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { ReviewsView } from "@/components/reviews/ReviewsView";

export const dynamic = "force-dynamic";

export default async function MonthlyReviewsPage() {
  const session = await auth();
  const userId = session!.user!.id;

  const reviews = await db.review.findMany({
    where: { userId, type: "MONTHLY" },
    orderBy: { periodStart: "desc" },
  });

  return <ReviewsView type="MONTHLY" reviews={reviews} />;
}
