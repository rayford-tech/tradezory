import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const reviewSchema = z.object({
  type: z.enum(["WEEKLY", "MONTHLY"]),
  periodStart: z.string().datetime(),
  periodEnd: z.string().datetime(),
  summary: z.string().optional().nullable(),
  improvements: z.string().optional().nullable(),
  lessons: z.string().optional().nullable(),
  goals: z.string().optional().nullable(),
  score: z.number().int().min(1).max(10).optional().nullable(),
});

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");
  const year = searchParams.get("year");

  const reviews = await db.review.findMany({
    where: {
      userId: session.user.id,
      ...(type && { type: type as any }),
      ...(year && {
        periodStart: {
          gte: new Date(`${year}-01-01`),
          lt: new Date(`${parseInt(year) + 1}-01-01`),
        },
      }),
    },
    orderBy: { periodStart: "desc" },
  });
  return NextResponse.json(reviews);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = reviewSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  const review = await db.review.create({
    data: {
      ...parsed.data,
      userId: session.user.id,
      periodStart: new Date(parsed.data.periodStart),
      periodEnd: new Date(parsed.data.periodEnd),
    },
  });
  return NextResponse.json(review, { status: 201 });
}
