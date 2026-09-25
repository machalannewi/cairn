import { NextResponse } from "next/server";
import { ACCEPTED, addDocument, removeSamples } from "@/lib/ingest";
import { actor, apiWorkspace, forbidden } from "@/lib/session";
import { readDb } from "@/lib/store";

export async function GET() {
  const ws = await apiWorkspace();
  if (ws instanceof NextResponse) return ws;
  return NextResponse.json({ docs: (await readDb(ws.orgId)).docs });
}

export async function POST(req: Request) {
  const ws = await apiWorkspace();
  if (ws instanceof NextResponse) return ws;
  const form = await req.formData();
  const files = form.getAll("files").filter((f): f is File => f instanceof File);
  if (!files.length) return NextResponse.json({ error: "No files received" }, { status: 400 });
  const by = await actor(ws.userId);

  const results = await Promise.all(
    files.map(async (file) => {
      const ext = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();
      if (!ACCEPTED.includes(ext)) return { name: file.name, error: `Unsupported type ${ext}` };
      try {
        const doc = await addDocument(ws.orgId, file.name, Buffer.from(await file.arrayBuffer()), by);
        return { name: file.name, doc };
      } catch (e) {
        return { name: file.name, error: e instanceof Error ? e.message : "Could not read file" };
      }
    }),
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
