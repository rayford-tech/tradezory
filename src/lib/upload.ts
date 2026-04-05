import { createUploadthing, type FileRouter } from "uploadthing/next";
import { auth } from "@/lib/auth";
import { z } from "zod";

const f = createUploadthing();

export const ourFileRouter = {
  screenshotUploader: f({ image: { maxFileSize: "8MB", maxFileCount: 5 } })
    .input(z.object({ tradeId: z.string().min(1) }))
    .middleware(async ({ input }) => {
      const session = await auth();
      if (!session?.user?.id) throw new Error("Unauthorized");
      return { userId: session.user.id, tradeId: input.tradeId };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      const { db } = await import("@/lib/db");
      await db.screenshot.create({
        data: {
          tradeId: metadata.tradeId,
          url: file.ufsUrl,
          fileKey: file.key,
          label: file.name,
        },
      });
      return { url: file.ufsUrl, key: file.key };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
