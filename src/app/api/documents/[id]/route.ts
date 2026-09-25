import { NextResponse } from "next/server";
import { removeDocument } from "@/lib/ingest";
import { apiWorkspace, forbidden } from "@/lib/session";
import { docChunks, getDoc } from "@/lib/store";

export async function GET(_req: Request, ctx: RouteContext<"/api/documents/[id]">) {
  const ws = await apiWorkspace();
  if (ws instanceof NextResponse) return ws;
  const { id } = await ctx.params;
  const doc = await getDoc(ws.orgId, id);
  if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ doc, chunks: await docChunks(ws.orgId, id) });
}

export async function DELETE(_req: Request, ctx: RouteContext<"/api/documents/[id]">) {
  const ws = await apiWorkspace();
  if (ws instanceof NextResponse) return ws;
  if (!ws.isAdmin) return forbidden("Only workspace admins can remove documents");
  const { id } = await ctx.params;
  const ok = await removeDocument(ws.orgId, id);
  return ok ? NextResponse.json({ ok }) : NextResponse.json({ error: "Not found" }, { status: 404 });
}
