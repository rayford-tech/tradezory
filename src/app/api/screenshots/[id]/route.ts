import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { UTApi } from "uploadthing/server";

const utapi = new UTApi();

type Params = { params: Promise<{ id: string }> };

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const screenshot = await db.screenshot.findFirst({
    where: { id },
    include: { trade: { select: { userId: true } } },
  });

  if (!screenshot || screenshot.trade.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Delete from UploadThing storage
  await utapi.deleteFiles([screenshot.fileKey]);

  await db.screenshot.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
