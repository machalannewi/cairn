import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { apiWorkspace, forbidden } from "@/lib/session";
import { indexShare, mutate } from "@/lib/store";

/** Create (or return) an unguessable read-only link. Sharing also saves the research. */
export async function POST(_req: Request, ctx: RouteContext<"/api/research/[id]/share">) {
  const ws = await apiWorkspace();
  if (ws instanceof NextResponse) return ws;
  const { id } = await ctx.params;
  const token = await mutate(ws.orgId, (db) => {
    const r = db.research.find((x) => x.id === id);
    if (!r) return null;
    r.shareToken ??= randomBytes(12).toString("base64url");
    r.saved = true;
    return r.shareToken;
  });
  if (!token) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await indexShare(token, ws.orgId);
  return NextResponse.json({ token });
}

/** Admins can revoke any link; members only links on their own research. */
export async function DELETE(_req: Request, ctx: RouteContext<"/api/research/[id]/share">) {
  const ws = await apiWorkspace();
  if (ws instanceof NextResponse) return ws;
  const { id } = await ctx.params;
  const outcome = await mutate(ws.orgId, (db) => {
    const r = db.research.find((x) => x.id === id);
    if (!r?.shareToken) return { status: "none" as const };
    if (!ws.isAdmin && r.createdBy?.id !== ws.userId) return { status: "forbidden" as const };
    const token = r.shareToken;
    delete r.shareToken;
    return { status: "ok" as const, token };
  });
  if (outcome.status === "forbidden") return forbidden("Only the author or an admin can revoke this link");
  if (outcome.status === "ok") await indexShare(outcome.token, null);
  return NextResponse.json({ ok: true });
}
