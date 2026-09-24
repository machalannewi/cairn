import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { mutate } from "@/lib/store";

/** Create (or return) an unguessable read-only link. Sharing also saves the research. */
export async function POST(_req: Request, ctx: RouteContext<"/api/research/[id]/share">) {
  const { id } = await ctx.params;
  const token = await mutate((db) => {
    const r = db.research.find((x) => x.id === id);
    if (!r) return null;
    r.shareToken ??= randomBytes(12).toString("base64url");
    r.saved = true;
    return r.shareToken;
  });
  return token ? NextResponse.json({ token }) : NextResponse.json({ error: "Not found" }, { status: 404 });
}

export async function DELETE(_req: Request, ctx: RouteContext<"/api/research/[id]/share">) {
  const { id } = await ctx.params;
  await mutate((db) => {
    const r = db.research.find((x) => x.id === id);
    if (r) delete r.shareToken;
  });
  return NextResponse.json({ ok: true });
}
