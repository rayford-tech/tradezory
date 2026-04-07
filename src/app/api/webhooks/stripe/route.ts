import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { db } from "@/lib/db";

const PRICE_TO_PLAN: Record<string, "STARTER" | "PRO" | "ELITE"> = {
  [process.env.STRIPE_PRICE_STARTER ?? ""]: "STARTER",
  [process.env.STRIPE_PRICE_PRO ?? ""]: "PRO",
  [process.env.STRIPE_PRICE_ELITE ?? ""]: "ELITE",
};

export async function POST(req: NextRequest) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");
  if (!sig) return NextResponse.json({ error: "No signature" }, { status: 400 });

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const cs = event.data.object as Stripe.Checkout.Session;
      if (cs.mode !== "subscription" || !cs.subscription) break;
      const sub = await stripe.subscriptions.retrieve(cs.subscription as string);
      const priceId = sub.items.data[0]?.price.id ?? "";
      const plan = PRICE_TO_PLAN[priceId] ?? "FREE";
      const userId = sub.metadata?.userId ?? cs.metadata?.userId;
      if (!userId) break;
      await db.user.update({
        where: { id: userId },
        data: {
          plan,
          stripeSubscriptionId: sub.id,
          subscriptionStatus: sub.status,
          currentPeriodEnd: new Date((sub as any).current_period_end * 1000),
        },
      });
      break;
    }

    case "customer.subscription.updated": {
      const sub = event.data.object as Stripe.Subscription;
      const priceId = sub.items.data[0]?.price.id ?? "";
      const plan = PRICE_TO_PLAN[priceId] ?? "FREE";
      await db.user.updateMany({
        where: { stripeSubscriptionId: sub.id },
        data: {
          plan,
          subscriptionStatus: sub.status,
          currentPeriodEnd: new Date((sub as any).current_period_end * 1000),
        },
      });
      break;
    }

    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      await db.user.updateMany({
        where: { stripeSubscriptionId: sub.id },
        data: {
          plan: "FREE",
          stripeSubscriptionId: null,
          subscriptionStatus: "canceled",
          currentPeriodEnd: null,
        },
      });
      break;
    }
  }

  return NextResponse.json({ received: true });
}
