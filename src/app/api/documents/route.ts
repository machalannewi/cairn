import { NextResponse } from "next/server";
import { del, get } from "@vercel/blob";
import { ACCEPTED, addDocument, removeSamples } from "@/lib/ingest";
import { actor, apiWorkspace, forbidden, type Workspace } from "@/lib/session";
import { listDocs } from "@/lib/store";
import type { Actor } from "@/lib/types";

export async function GET() {
  const ws = await apiWorkspace();
  if (ws instanceof NextResponse) return ws;
  return NextResponse.json({ docs: await listDocs(ws.orgId) });
}

async function ingest(ws: Workspace, by: Actor, name: string, load: () => Promise<Buffer>) {
  const ext = name.slice(name.lastIndexOf(".")).toLowerCase();
  if (!ACCEPTED.includes(ext)) return { name, error: `Unsupported type ${ext}` };
  try {
    return { name, doc: await addDocument(ws.orgId, name, await load(), by) };
  } catch (e) {
    return { name, error: e instanceof Error ? e.message : "Could not read file" };
  }
}

/**
 * Two ways in:
 *  - multipart form with `files` (small files, sent straight here)
 *  - JSON `{ blobs: [{ pathname, name }] }` for large files already uploaded to
 *    private Blob via /api/uploads; each blob is parsed, then deleted.
 */
export async function POST(req: Request) {
  const ws = await apiWorkspace();
  if (ws instanceof NextResponse) return ws;
  const by = await actor(ws.userId);

  if (req.headers.get("content-type")?.includes("application/json")) {
    const { blobs = [] } = (await req.json().catch(() => ({}))) as { blobs?: { pathname: string; name: string }[] };
    if (!blobs.length) return NextResponse.json({ error: "No files received" }, { status: 400 });
    const results = await Promise.all(
      blobs.map(async (b) => {
        // Only blobs inside this workspace's prefix — never fetch another org's upload.
        if (!b.pathname?.startsWith(`uploads/${ws.orgId}/`)) return { name: b.name, error: "Invalid upload" };
        try {
          return await ingest(ws, by, b.name, async () => {
            const blob = await get(b.pathname, { access: "private" });
            if (!blob || blob.statusCode !== 200) throw new Error("Upload not found — try again");
            return Buffer.from(await new Response(blob.stream).arrayBuffer());
          });
        } finally {
          await del(b.pathname).catch(() => {});
        }
      }),
    );
    return NextResponse.json({ results });
  }

  const form = await req.formData();
  const files = form.getAll("files").filter((f): f is File => f instanceof File);
  if (!files.length) return NextResponse.json({ error: "No files received" }, { status: 400 });
  const results = await Promise.all(
    files.map((file) => ingest(ws, by, file.name, async () => Buffer.from(await file.arrayBuffer()))),
  );
  return NextResponse.json({ results });
}

/** DELETE /api/documents?samples=1 — admins can clear the seeded sample documents. */
export async function DELETE(req: Request) {
  const ws = await apiWorkspace();
  if (ws instanceof NextResponse) return ws;
  if (!ws.isAdmin) return forbidden();
  if (new URL(req.url).searchParams.get("samples") !== "1")
    return NextResponse.json({ error: "Nothing to delete" }, { status: 400 });
  return NextResponse.json({ removed: await removeSamples(ws.orgId) });
}
