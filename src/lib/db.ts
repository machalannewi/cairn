import "server-only";
import { neon, type NeonQueryFunction } from "@neondatabase/serverless";

/**
 * Neon Postgres over HTTP — no connection pool to manage, works the same on
 * Vercel functions and locally. Created lazily so builds don't need DATABASE_URL.
 */
let client: NeonQueryFunction<false, false> | null = null;

export function sql() {
  if (!client) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("DATABASE_URL is not set. Add your Neon connection string to .env.local.");
    client = neon(url);
  }
  return client;
}

const SCHEMA = [
  `create table if not exists workspaces (
    org_id text primary key,
    name text not null,
    focus text not null default 'Market research',
    created_at timestamptz not null default now()
  )`,
  `create table if not exists documents (
    id text primary key,
    org_id text not null references workspaces(org_id) on delete cascade,
    name text not null,
    kind text not null,
    size integer not null,
    category text not null,
    uploaded_at timestamptz not null default now(),
    chunk_count integer not null,
    word_count integer not null,
    excerpt text not null,
    sheets jsonb,
    sample boolean not null default false,
    uploaded_by jsonb
  )`,
  `create index if not exists documents_org_idx on documents (org_id, uploaded_at desc)`,
  `create table if not exists chunks (
    id text primary key,
    doc_id text not null references documents(id) on delete cascade,
    org_id text not null,
    idx integer not null,
    location text not null,
    text text not null
  )`,
  `create index if not exists chunks_org_idx on chunks (org_id)`,
  `create index if not exists chunks_doc_idx on chunks (doc_id, idx)`,
  `create table if not exists research (
    id text primary key,
    org_id text not null references workspaces(org_id) on delete cascade,
    created_at timestamptz not null default now(),
    created_by text,
    saved boolean not null default false,
    share_token text unique,
    record jsonb not null
  )`,
  `create index if not exists research_org_idx on research (org_id, created_at desc)`,
  `create table if not exists usage (
    org_id text not null,
    day date not null,
    runs integer not null default 0,
    primary key (org_id, day)
  )`,
];

// Idempotent; runs once per server instance before the first query.
const g = globalThis as typeof globalThis & { __cairnSchema?: Promise<void> };

export function ready(): Promise<void> {
  g.__cairnSchema ??= (async () => {
    const q = sql();
    for (const stmt of SCHEMA) await q.query(stmt);
  })().catch((e) => {
    g.__cairnSchema = undefined;
    throw e;
  });
  return g.__cairnSchema;
}
