import { NextResponse } from "next/server";
import { apiWorkspace, forbidden } from "@/lib/session";
import { deleteResearch, getResearch, updateResearch } from "@/lib/store";

export async function GET(_req: Request, ctx: RouteContext<"/api/research/[id]">) {
  const ws = await apiWorkspace();
  if (ws instanceof NextResponse) return ws;
  const { id } = await ctx.params;
  const r = await getResearch(ws.orgId, id);
  return r ? NextResponse.json({ record: r }) : NextResponse.json({ error: "Not found" }, { status: 404 });
}

export async function PATCH(req: Request, ctx: RouteContext<"/api/research/[id]">) {
  const ws = await apiWorkspace();
  if (ws instanceof NextResponse) return ws;
  const { id } = await ctx.params;
  const body = (await req.json().catch(() => ({}))) as { saved?: boolean; title?: string; notes?: string };
  const record = await updateResearch(ws.orgId, id, {
    saved: typeof body.saved === "boolean" ? body.saved : undefined,
    title: typeof body.title === "string" && body.title.trim() ? body.title.trim().slice(0, 140) : undefined,
    notes: typeof body.notes === "string" ? body.notes.slice(0, 5000) : undefined,
  });
  return record ? NextResponse.json({ record }) : NextResponse.json({ error: "Not found" }, { status: 404 });
}

/** Admins can delete any run; members only their own. Deleting also kills its share link. */
export async function DELETE(_req: Request, ctx: RouteContext<"/api/research/[id]">) {
  const ws = await apiWorkspace();
  if (ws instanceof NextResponse) return ws;
  const { id } = await ctx.params;
  const r = await getResearch(ws.orgId, id);
  if (!r) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!ws.isAdmin && r.createdBy?.id !== ws.userId) return forbidden("Only the author or an admin can delete this");
  await deleteResearch(ws.orgId, id);
  return NextResponse.json({ ok: true });
}
