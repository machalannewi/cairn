import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { apiWorkspace, forbidden } from "@/lib/session";
import { getResearch, shareResearch, unshareResearch } from "@/lib/store";

/** Create (or return) an unguessable read-only link. Sharing also saves the research. */
export async function POST(_req: Request, ctx: RouteContext<"/api/research/[id]/share">) {
  const ws = await apiWorkspace();
  if (ws instanceof NextResponse) return ws;
  const { id } = await ctx.params;
  const token = await shareResearch(ws.orgId, id, randomBytes(12).toString("base64url"));
  return token ? NextResponse.json({ token }) : NextResponse.json({ error: "Not found" }, { status: 404 });
}

/** Admins can revoke any link; members only links on their own research. */
export async function DELETE(_req: Request, ctx: RouteContext<"/api/research/[id]/share">) {
  const ws = await apiWorkspace();
  if (ws instanceof NextResponse) return ws;
  const { id } = await ctx.params;
  const r = await getResearch(ws.orgId, id);
  if (!r) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!ws.isAdmin && r.createdBy?.id !== ws.userId)
    return forbidden("Only the author or an admin can revoke this link");
  await unshareResearch(ws.orgId, id);
  return NextResponse.json({ ok: true });
}
