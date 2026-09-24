import type { Chunk, DocRecord, Source } from "./types";

const STOP = new Set(
  "a an and are as at be but by for from has have how i if in into is it its of on or our should that the their them then there these they this to was we were what when where which who why will with would you your vs versus about does do can could than over under per".split(
    " ",
  ),
);

export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}%$€£.\s-]/gu, " ")
    .split(/[\s-]+/)
    .map((t) => t.replace(/^\.+|\.+$/g, ""))
    .filter((t) => t && !STOP.has(t))
    .map(stem);
}

/** Tiny suffix stemmer — enough to match "pricing"/"price", "customers"/"customer". */
function stem(t: string) {
  if (t.length < 5 || /\d/.test(t)) return t;
  return t.replace(/(ies)$/, "y").replace(/(ing|ed|es|s)$/, "").replace(/e$/, "");
}

export interface Hit {
  chunk: Chunk;
  doc: DocRecord;
  score: number;
}

/** Okapi BM25 over chunks, with a small boost for query terms in the doc title. */
export function searchChunks(
  query: string,
  chunks: Chunk[],
  docs: DocRecord[],
  opts: { limit?: number; docIds?: string[] } = {},
): Hit[] {
  const q = [...new Set(tokenize(query))];
  if (!q.length) return [];
  const docMap = new Map(docs.map((d) => [d.id, d]));
  const pool = chunks.filter(
    (c) => docMap.has(c.docId) && (!opts.docIds?.length || opts.docIds.includes(c.docId)),
  );
  if (!pool.length) return [];

  const toks = pool.map((c) => tokenize(c.text));
  const avg = toks.reduce((s, t) => s + t.length, 0) / pool.length;
  const df = new Map<string, number>();
  for (const t of toks) for (const term of new Set(t)) df.set(term, (df.get(term) ?? 0) + 1);

  const k1 = 1.4;
  const b = 0.72;
  const N = pool.length;
  const hits: Hit[] = [];
  pool.forEach((c, i) => {
    const tf = new Map<string, number>();
    for (const t of toks[i]) tf.set(t, (tf.get(t) ?? 0) + 1);
    let score = 0;
    for (const term of q) {
      const f = tf.get(term);
      if (!f) continue;
      const n = df.get(term) ?? 0;
      const idf = Math.log(1 + (N - n + 0.5) / (n + 0.5));
      score += idf * ((f * (k1 + 1)) / (f + k1 * (1 - b + (b * toks[i].length) / avg)));
    }
    if (!score) return;
    const doc = docMap.get(c.docId)!;
    const title = tokenize(doc.name + " " + c.location);
    score *= 1 + 0.15 * q.filter((t) => title.includes(t)).length;
    hits.push({ chunk: c, doc, score });
  });
  hits.sort((a, b) => b.score - a.score);
  return hits.slice(0, opts.limit ?? 20);
}

/**
 * Pick passages for the model: best hits overall, but no single document may
 * take more than `perDoc` slots so comparisons see every side.
 */
export function selectSources(hits: Hit[], max = 14, perDoc = 5): Source[] {
  const count = new Map<string, number>();
  const out: Source[] = [];
  for (const h of hits) {
    const c = count.get(h.doc.id) ?? 0;
    if (c >= perDoc) continue;
    count.set(h.doc.id, c + 1);
    out.push({
      n: out.length + 1,
      chunkId: h.chunk.id,
      docId: h.doc.id,
      docName: h.doc.name,
      location: h.chunk.location,
      text: h.chunk.text,
      score: Math.round(h.score * 100) / 100,
    });
    if (out.length >= max) break;
  }
  return out;
}

/** A readable snippet around the densest cluster of query terms. */
export function snippet(text: string, query: string, len = 240): string {
  const terms = tokenize(query);
  const lower = text.toLowerCase();
  let best = 0;
  for (const t of terms) {
    const i = lower.indexOf(t);
    if (i >= 0) {
      best = i;
      break;
    }
  }
  const start = Math.max(0, best - 60);
  const s = text.slice(start, start + len).replace(/\s+/g, " ").trim();
  return (start > 0 ? "…" : "") + s + (start + len < text.length ? "…" : "");
}
