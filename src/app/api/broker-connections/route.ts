import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { encrypt } from "@/lib/encryption";
import { z } from "zod";

const createSchema = z.object({
  platform: z.enum(["MT5", "MT4", "CTRADER", "TRADOVATE", "INTERACTIVEBROKERS", "OTHER"]),
  brokerName: z.string().min(1).max(100),
  server: z.string().min(1).max(200),
  login: z.string().min(1).max(50),
  password: z.string().min(1),
  tradingAccountId: z.string().optional(),
  syncFromDate: z.string().optional(),
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const connections = await db.brokerConnection.findMany({
    where: { userId: session.user.id },
    include: { tradingAccount: { select: { id: true, name: true, type: true } } },
    orderBy: { createdAt: "desc" },
  });

  // Never return the encrypted password
  return NextResponse.json(
    connections.map(({ encryptedPassword: _, ...c }) => c)
  );
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!process.env.ENCRYPTION_KEY) {
    return NextResponse.json({ error: "Server encryption not configured" }, { status: 500 });
  }

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  const { platform, brokerName, server, login, password, tradingAccountId, syncFromDate } = parsed.data;

  // Encrypt the investor password
  const encryptedPassword = encrypt(password);

  // Create the connection record — credentials stored locally, EA webhook handles live sync
  const connection = await db.brokerConnection.create({
    data: {
      userId: session.user.id,
      platform,
      brokerName,
      server,
      login,
      encryptedPassword,
      tradingAccountId: tradingAccountId || null,
      syncFromDate: syncFromDate ? new Date(syncFromDate) : null,
      status: "ACTIVE",
    },
    include: { tradingAccount: { select: { id: true, name: true, type: true } } },
  });

  const { encryptedPassword: _, ...safe } = connection;
  return NextResponse.json(safe, { status: 201 });
}
