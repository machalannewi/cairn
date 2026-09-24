import { NextResponse } from "next/server";
import { mutate, readDb } from "@/lib/store";

export async function GET(_req: Request, ctx: RouteContext<"/api/research/[id]">) {
  const { id } = await ctx.params;
  const r = (await readDb()).research.find((x) => x.id === id);
  return r ? NextResponse.json({ record: r }) : NextResponse.json({ error: "Not found" }, { status: 404 });
}

export async function PATCH(req: Request, ctx: RouteContext<"/api/research/[id]">) {
  const { id } = await ctx.params;
  const body = (await req.json()) as { saved?: boolean; title?: string; notes?: string };
  const record = await mutate((db) => {
    const r = db.research.find((x) => x.id === id);
    if (!r) return null;
    if (typeof body.saved === "boolean") r.saved = body.saved;
    if (typeof body.title === "string" && body.title.trim()) r.title = body.title.trim().slice(0, 140);
    if (typeof body.notes === "string") r.notes = body.notes.slice(0, 5000);
    return r;
  });
  return record ? NextResponse.json({ record }) : NextResponse.json({ error: "Not found" }, { status: 404 });
}

export async function DELETE(_req: Request, ctx: RouteContext<"/api/research/[id]">) {
  const { id } = await ctx.params;
  await mutate((db) => {
    db.research = db.research.filter((x) => x.id !== id);
  });
  return NextResponse.json({ ok: true });
}
