import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const conn = await db.brokerConnection.findUnique({ where: { id } });
  if (!conn || conn.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Trades sync happens automatically via the MT5 EA webhook.
  // Return instructions so the client can show the user what to do.
  return NextResponse.json({
    method: "ea_webhook",
    message: "Trades sync automatically via the Tradezory EA installed in MetaTrader.",
    steps: [
      "Download the Tradezory_EA.mq5 file from the Import page",
      "Open MetaTrader 5 → File → Open Data Folder → MQL5 → Experts",
      "Copy the EA file there, restart MT5",
      "Attach the EA to any chart — it will push trades to Tradezory in real time",
    ],
    downloadUrl: "/mt5-ea/Tradezory_EA.mq5",
  });
}
