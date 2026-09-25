import { NextResponse } from "next/server";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { MAX_BYTES } from "@/lib/ingest";
import { apiWorkspace } from "@/lib/session";

/**
 * Issues short-lived tokens so the browser can upload large files straight to a
 * private Vercel Blob (bypassing the ~4.5 MB function body limit). Uploads are
 * confined to the caller's own workspace prefix; /api/documents then parses the
 * blob and deletes it — originals are never kept.
 */
export async function POST(req: Request) {
  const ws = await apiWorkspace();
  if (ws instanceof NextResponse) return ws;
  if (!process.env.BLOB_READ_WRITE_TOKEN)
    return NextResponse.json({ error: "Large uploads need BLOB_READ_WRITE_TOKEN to be configured" }, { status: 501 });

  const body = (await req.json()) as HandleUploadBody;
  try {
    const json = await handleUpload({
      body,
      request: req,
      onBeforeGenerateToken: async (pathname) => {
        if (!pathname.startsWith(`uploads/${ws.orgId}/`)) throw new Error("Invalid upload path");
        return {
          maximumSizeInBytes: MAX_BYTES,
          addRandomSuffix: true,
          validUntil: Date.now() + 10 * 60_000,
        };
      },
    });
    return NextResponse.json(json);
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Upload failed" }, { status: 400 });
  }
}
