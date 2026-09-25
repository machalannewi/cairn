import { NextResponse } from "next/server";
import { apiWorkspace, forbidden } from "@/lib/session";
import { indexShare, mutate, readDb } from "@/lib/store";

export async function GET(_req: Request, ctx: RouteContext<"/api/research/[id]">) {
  const ws = await apiWorkspace();
  if (ws instanceof NextResponse) return ws;
  const { id } = await ctx.params;
  const r = (await readDb(ws.orgId)).research.find((x) => x.id === id);
  return r ? NextResponse.json({ record: r }) : NextResponse.json({ error: "Not found" }, { status: 404 });
}

export async function PATCH(req: Request, ctx: RouteContext<"/api/research/[id]">) {
  const ws = await apiWorkspace();
  if (ws instanceof NextResponse) return ws;
  const { id } = await ctx.params;
  const body = (await req.json()) as { saved?: boolean; title?: string; notes?: string };
  const record = await mutate(ws.orgId, (db) => {
    const r = db.research.find((x) => x.id === id);
    if (!r) return null;
    if (typeof body.saved === "boolean") r.saved = body.saved;
    if (typeof body.title === "string" && body.title.trim()) r.title = body.title.trim().slice(0, 140);
    if (typeof body.notes === "string") r.notes = body.notes.slice(0, 5000);
    return r;
  });
  return record ? NextResponse.json({ record }) : NextResponse.json({ error: "Not found" }, { status: 404 });
}

/** Admins can delete any run; members only their own. */
export async function DELETE(_req: Request, ctx: RouteContext<"/api/research/[id]">) {
  const ws = await apiWorkspace();
  if (ws instanceof NextResponse) return ws;
  const { id } = await ctx.params;
  const outcome = await mutate(ws.orgId, (db) => {
    const r = db.research.find((x) => x.id === id);
    if (!r) return { status: "missing" as const };
    if (!ws.isAdmin && r.createdBy?.id !== ws.userId) return { status: "forbidden" as const };
    db.research = db.research.filter((x) => x.id !== id);
    return { status: "ok" as const, token: r.shareToken };
  });
  if (outcome.status === "missing") return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (outcome.status === "forbidden") return forbidden("Only the author or an admin can delete this");
  if (outcome.token) await indexShare(outcome.token, null);
  return NextResponse.json({ ok: true });
}
