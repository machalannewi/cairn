import { NextResponse } from "next/server";
import { searchChunks, snippet } from "@/lib/search";
import { readDb } from "@/lib/store";

export async function GET(req: Request) {
  const q = new URL(req.url).searchParams.get("q")?.trim() ?? "";
  if (!q) return NextResponse.json({ hits: [] });
  const db = await readDb();
  const hits = searchChunks(q, db.chunks, db.docs, { limit: 25 }).map((h) => ({
    chunkId: h.chunk.id,
    docId: h.doc.id,
    docName: h.doc.name,
    kind: h.doc.kind,
    location: h.chunk.location,
    snippet: snippet(h.chunk.text, q),
    score: Math.round(h.score * 100) / 100,
  }));
  return NextResponse.json({ hits });
}
