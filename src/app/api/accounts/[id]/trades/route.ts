import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  // Verify the account belongs to the current user
  const account = await db.tradingAccount.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!account) return NextResponse.json({ error: "Account not found" }, { status: 404 });

  const { count } = await db.trade.deleteMany({ where: { accountId: id } });

  return NextResponse.json({ deleted: count });
}
