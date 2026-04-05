import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { ReviewsView } from "@/components/reviews/ReviewsView";

export const dynamic = "force-dynamic";

export default async function WeeklyReviewsPage() {
  const session = await auth();
  const userId = session!.user!.id;

  const reviews = await db.review.findMany({
    where: { userId, type: "WEEKLY" },
    orderBy: { periodStart: "desc" },
  });

  return <ReviewsView type="WEEKLY" reviews={reviews} />;
}
