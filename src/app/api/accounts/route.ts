import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const accountSchema = z.object({
  name: z.string().min(1).max(100),
  broker: z.string().optional().nullable(),
  accountNumber: z.string().optional().nullable(),
  currency: z.string().default("USD"),
  balance: z.number().optional().nullable(),
  type: z.enum(["LIVE", "DEMO", "BACKTEST"]),
  isDefault: z.boolean().default(false),
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const accounts = await db.tradingAccount.findMany({
    where: { userId: session.user.id },
    orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
  });
  return NextResponse.json(accounts);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = accountSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  // If isDefault, unset other defaults
  if (parsed.data.isDefault) {
    await db.tradingAccount.updateMany({
      where: { userId: session.user.id },
      data: { isDefault: false },
    });
  }

  const account = await db.tradingAccount.create({
    data: { ...parsed.data, userId: session.user.id },
  });
  return NextResponse.json(account, { status: 201 });
}
