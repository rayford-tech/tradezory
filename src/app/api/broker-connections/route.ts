import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { encrypt } from "@/lib/encryption";
import { isMetaApiConfigured, provisionAccount } from "@/lib/metaapi";
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

  // Create the connection record
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
      status: "PENDING",
    },
    include: { tradingAccount: { select: { id: true, name: true, type: true } } },
  });

  // If MetaApi is configured, provision the account asynchronously
  if (isMetaApiConfigured() && (platform === "MT5" || platform === "MT4")) {
    try {
      const metaApiAccountId = await provisionAccount({
        name: `${brokerName} ${login}`,
        server,
        login,
        password,
        platform: platform.toLowerCase() as "mt5" | "mt4",
      });

      await db.brokerConnection.update({
        where: { id: connection.id },
        data: { metaApiAccountId, status: "CONNECTING" },
      });
    } catch (err: any) {
      await db.brokerConnection.update({
        where: { id: connection.id },
        data: { status: "ERROR", lastError: err.message },
      });
    }
  }

  const { encryptedPassword: _, ...safe } = connection;
  return NextResponse.json(safe, { status: 201 });
}
