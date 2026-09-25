import "server-only";
import { ready, sql } from "./db";
import type { Actor, Chunk, DocRecord, ResearchRecord } from "./types";

/**
 * Data access, always keyed by an orgId taken from the verified session.
 * Every query filters on org_id so one workspace can never read another's rows.
 */

const iso = (v: unknown) => new Date(v as string).toISOString();

/* ───────────────────────── Workspaces ───────────────────────── */

export type WorkspaceRow = { name: string; focus: string };

/** Get (or create and seed) the workspace for an org, keeping its display name current. */
export async function ensureWorkspace(orgId: string, name: string): Promise<WorkspaceRow> {
  await ready();
  const q = sql();
  const [existing] = await q`select name, focus from workspaces where org_id = ${orgId}`;
  if (existing) {
    if (existing.name !== name) await q`update workspaces set name = ${name} where org_id = ${orgId}`;
    return { name, focus: existing.focus as string };
  }
  const created = await q`
    insert into workspaces (org_id, name) values (${orgId}, ${name})
    on conflict (org_id) do nothing
    returning org_id`;
  // Only the request that created the row seeds, so concurrent first visits can't double-seed.
  if (created.length) {
    const { seedWorkspace } = await import("./seed");
    await seedWorkspace(orgId);
  }
  return (await getWorkspace(orgId)) ?? { name, focus: "Market research" };
}

export async function getWorkspace(orgId: string): Promise<WorkspaceRow | null> {
  await ready();
  const [row] = await sql()`select name, focus from workspaces where org_id = ${orgId}`;
  return (row as WorkspaceRow) ?? null;
}

export async function setFocus(orgId: string, focus: string) {
  await ready();
  await sql()`update workspaces set focus = ${focus} where org_id = ${orgId}`;
}

export async function counts(orgId: string) {
  await ready();
  const [row] = await sql()`
    select
      (select count(*) from documents where org_id = ${orgId})::int as docs,
      (select count(*) from chunks where org_id = ${orgId})::int as chunks,
      (select count(*) from research where org_id = ${orgId})::int as research,
      (select count(*) from research where org_id = ${orgId} and saved)::int as saved,
      (select count(*) from research where org_id = ${orgId} and share_token is not null)::int as shared,
      (select coalesce(sum(word_count), 0) from documents where org_id = ${orgId})::int as words`;
  return row as { docs: number; chunks: number; research: number; saved: number; shared: number; words: number };
}

/* ───────────────────────── Documents & chunks ───────────────────────── */

function toDoc(r: Record<string, unknown>): DocRecord {
  return {
    id: r.id as string,
    name: r.name as string,
    kind: r.kind as DocRecord["kind"],
    size: r.size as number,
    category: r.category as DocRecord["category"],
    uploadedAt: iso(r.uploaded_at),
    chunkCount: r.chunk_count as number,
    wordCount: r.word_count as number,
    excerpt: r.excerpt as string,
    sheets: (r.sheets as DocRecord["sheets"]) ?? undefined,
    sample: (r.sample as boolean) || undefined,
    uploadedBy: (r.uploaded_by as Actor) ?? undefined,
  };
}

const toChunk = (r: Record<string, unknown>): Chunk => ({
  id: r.id as string,
  docId: r.doc_id as string,
  index: r.idx as number,
  location: r.location as string,
  text: r.text as string,
});

export async function listDocs(orgId: string): Promise<DocRecord[]> {
  await ready();
  const rows = await sql()`select * from documents where org_id = ${orgId} order by uploaded_at desc, name`;
  return rows.map(toDoc);
}

export async function getDoc(orgId: string, id: string): Promise<DocRecord | null> {
  await ready();
  const [row] = await sql()`select * from documents where org_id = ${orgId} and id = ${id}`;
  return row ? toDoc(row) : null;
}

export async function docChunks(orgId: string, docId: string): Promise<Chunk[]> {
  await ready();
  const rows = await sql()`
    select id, doc_id, idx, location, text from chunks
    where org_id = ${orgId} and doc_id = ${docId} order by idx`;
  return rows.map(toChunk);
}

/** All passages in scope for search. Fine at team scale; move to Postgres FTS or pgvector when libraries grow. */
export async function allChunks(orgId: string, docIds: string[] = []): Promise<Chunk[]> {
  await ready();
  const rows = docIds.length
    ? await sql()`select id, doc_id, idx, location, text from chunks where org_id = ${orgId} and doc_id = any(${docIds})`
    : await sql()`select id, doc_id, idx, location, text from chunks where org_id = ${orgId}`;
  return rows.map(toChunk);
}

export async function insertDocument(orgId: string, doc: DocRecord, chunks: Chunk[]) {
  await ready();
  const q = sql();
  await q.transaction([
    q`insert into documents
        (id, org_id, name, kind, size, category, uploaded_at, chunk_count, word_count, excerpt, sheets, sample, uploaded_by)
      values
        (${doc.id}, ${orgId}, ${doc.name}, ${doc.kind}, ${doc.size}, ${doc.category}, ${doc.uploadedAt},
         ${doc.chunkCount}, ${doc.wordCount}, ${doc.excerpt}, ${doc.sheets ? JSON.stringify(doc.sheets) : null}::jsonb,
         ${!!doc.sample}, ${doc.uploadedBy ? JSON.stringify(doc.uploadedBy) : null}::jsonb)`,
    q`insert into chunks (id, doc_id, org_id, idx, location, text)
      select id, ${doc.id}, ${orgId}, idx, location, text
      from unnest(${chunks.map((c) => c.id)}::text[], ${chunks.map((c) => c.index)}::int[],
                  ${chunks.map((c) => c.location)}::text[], ${chunks.map((c) => c.text)}::text[])
        as t(id, idx, location, text)`,
  ]);
}

export async function deleteDocument(orgId: string, id: string): Promise<boolean> {
  await ready();
  const rows = await sql()`delete from documents where org_id = ${orgId} and id = ${id} returning id`;
  return rows.length > 0;
}

export async function deleteSamples(orgId: string): Promise<number> {
  await ready();
  const rows = await sql()`delete from documents where org_id = ${orgId} and sample returning id`;
  return rows.length;
}

/* ───────────────────────── Research ───────────────────────── */

// Columns are the source of truth for fields that change after creation.
function toResearch(r: Record<string, unknown>): ResearchRecord {
  const rec = r.record as ResearchRecord;
  return {
    ...rec,
    saved: r.saved as boolean,
    shareToken: (r.share_token as string) ?? undefined,
  };
}

export async function listResearch(orgId: string): Promise<ResearchRecord[]> {
  await ready();
  const rows = await sql()`select * from research where org_id = ${orgId} order by created_at desc`;
  return rows.map(toResearch);
}

export async function getResearch(orgId: string, id: string): Promise<ResearchRecord | null> {
  await ready();
  const [row] = await sql()`select * from research where org_id = ${orgId} and id = ${id}`;
  return row ? toResearch(row) : null;
}

export async function insertResearch(orgId: string, r: ResearchRecord) {
  await ready();
  await sql()`
    insert into research (id, org_id, created_at, created_by, saved, record)
    values (${r.id}, ${orgId}, ${r.createdAt}, ${r.createdBy?.id ?? null}, ${r.saved}, ${JSON.stringify(r)}::jsonb)`;
}

export async function updateResearch(
  orgId: string,
  id: string,
  patch: { saved?: boolean; title?: string; notes?: string },
): Promise<ResearchRecord | null> {
  await ready();
  const json: Record<string, string> = {};
  if (patch.title !== undefined) json.title = patch.title;
  if (patch.notes !== undefined) json.notes = patch.notes;
  const [row] = await sql()`
    update research set
      saved = coalesce(${patch.saved ?? null}::boolean, saved),
      record = record || ${JSON.stringify(json)}::jsonb
    where org_id = ${orgId} and id = ${id}
    returning *`;
  return row ? toResearch(row) : null;
}

export async function deleteResearch(orgId: string, id: string) {
  await ready();
  await sql()`delete from research where org_id = ${orgId} and id = ${id}`;
}

/** Set a share token only if none exists; returns the effective token. Sharing also saves. */
export async function shareResearch(orgId: string, id: string, token: string): Promise<string | null> {
  await ready();
  const [row] = await sql()`
    update research set share_token = coalesce(share_token, ${token}), saved = true
    where org_id = ${orgId} and id = ${id}
    returning share_token`;
  return (row?.share_token as string) ?? null;
}

export async function unshareResearch(orgId: string, id: string) {
  await ready();
  await sql()`update research set share_token = null where org_id = ${orgId} and id = ${id}`;
}

/** Public lookup for /share/[token] — the only query not scoped by a session org. */
export async function findShared(token: string) {
  await ready();
  const [row] = await sql()`
    select r.*, w.name as workspace_name from research r
    join workspaces w on w.org_id = r.org_id
    where r.share_token = ${token}`;
  return row ? { record: toResearch(row), workspace: row.workspace_name as string } : null;
}

/* ───────────────────────── Usage (daily AI run cap) ───────────────────────── */

/** Atomically take one run from today's allowance. Returns false when the cap is reached. */
export async function claimRun(orgId: string, limit: number): Promise<boolean> {
  await ready();
  const rows = await sql()`
    insert into usage (org_id, day, runs) values (${orgId}, current_date, 1)
    on conflict (org_id, day) do update set runs = usage.runs + 1
    where usage.runs < ${limit}
    returning runs`;
  return rows.length > 0;
}

/** Give a run back when the model call fails, so errors don't eat the allowance. */
export async function refundRun(orgId: string) {
  await ready();
  await sql()`update usage set runs = greatest(runs - 1, 0) where org_id = ${orgId} and day = current_date`;
}

export async function runsToday(orgId: string): Promise<number> {
  await ready();
  const [row] = await sql()`select runs from usage where org_id = ${orgId} and day = current_date`;
  return (row?.runs as number) ?? 0;
}
