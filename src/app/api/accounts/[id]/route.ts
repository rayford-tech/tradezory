import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const updateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  broker: z.string().optional().nullable(),
  accountNumber: z.string().optional().nullable(),
  currency: z.string().optional(),
  balance: z.number().optional().nullable(),
  type: z.enum(["LIVE", "DEMO", "BACKTEST"]).optional(),
  isDefault: z.boolean().optional(),
});

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const existing = await db.tradingAccount.findFirst({ where: { id, userId: session.user.id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  if (parsed.data.isDefault) {
    await db.tradingAccount.updateMany({
      where: { userId: session.user.id },
      data: { isDefault: false },
    });
  }

  const account = await db.tradingAccount.update({ where: { id }, data: parsed.data });
  return NextResponse.json(account);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const existing = await db.tradingAccount.findFirst({ where: { id, userId: session.user.id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await db.tradingAccount.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
