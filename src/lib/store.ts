import "server-only";
import { promises as fs } from "node:fs";
import path from "node:path";
import type { Database } from "./types";

/**
 * JSON-file store, one file per workspace (Clerk organization). Good enough for
 * a single-server deployment and swappable for Postgres later — every read and
 * write goes through here, always keyed by an orgId taken from the session.
 */
const DATA_DIR = path.join(process.cwd(), "data");
const ORG_DIR = path.join(DATA_DIR, "orgs");
const SHARES_FILE = path.join(DATA_DIR, "shares.json");

// Pages and route handlers can be bundled as separate module instances, so the
// cache lives on globalThis to guarantee one copy of each workspace per process.
type State = {
  dbs: Map<string, Database>;
  loading: Map<string, Promise<Database>>;
  writes: Map<string, Promise<void>>;
  shares: Promise<Map<string, string>> | null;
};
const g = globalThis as typeof globalThis & { __cairn2?: State };
const state: State = (g.__cairn2 ??= { dbs: new Map(), loading: new Map(), writes: new Map(), shares: null });

/** Org ids come from Clerk ("org_…"); refuse anything that could escape the data dir. */
function safeId(orgId: string) {
  if (!/^[A-Za-z0-9_-]{3,64}$/.test(orgId)) throw new Error("Invalid workspace id");
  return orgId;
}

const dbFile = (orgId: string) => path.join(ORG_DIR, `${safeId(orgId)}.json`);
export const uploadDir = (orgId: string) => path.join(DATA_DIR, "uploads", safeId(orgId));

function empty(name: string): Database {
  return {
    version: 1,
    workspace: { name, focus: "Market research", createdAt: new Date().toISOString() },
    docs: [],
    chunks: [],
    research: [],
  };
}

async function load(orgId: string, name = "Workspace"): Promise<Database> {
  const cached = state.dbs.get(orgId);
  if (cached) return cached;
  let pending = state.loading.get(orgId);
  if (!pending) {
    pending = (async () => {
      await fs.mkdir(uploadDir(orgId), { recursive: true });
      let db: Database;
      try {
        db = JSON.parse(await fs.readFile(dbFile(orgId), "utf8")) as Database;
      } catch {
        // New workspace: seed sample documents so the first visit isn't empty.
        db = empty(name);
        const { seedWorkspace } = await import("./seed");
        await seedWorkspace(db, orgId);
        await persist(orgId, db);
      }
      state.dbs.set(orgId, db);
      return db;
    })().finally(() => state.loading.delete(orgId));
    state.loading.set(orgId, pending);
  }
  return pending;
}

let n = 0;
async function writeAtomic(file: string, data: unknown) {
  await fs.mkdir(path.dirname(file), { recursive: true });
  const tmp = `${file}.${process.pid}.${n++}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(data));
  await fs.rename(tmp, file);
}

const persist = (orgId: string, db: Database) => writeAtomic(dbFile(orgId), db);

export async function readDb(orgId: string, name?: string): Promise<Database> {
  return load(orgId, name);
}

/** Serialises writes per workspace so concurrent requests never clobber each other. */
export async function mutate<T>(orgId: string, fn: (db: Database) => T | Promise<T>): Promise<T> {
  const db = await load(orgId);
  let result!: T;
  const prev = state.writes.get(orgId) ?? Promise.resolve();
  const run = prev.then(async () => {
    result = await fn(db);
    await persist(orgId, db);
  });
  state.writes.set(orgId, run.catch(() => {}));
  await run;
  return result;
}

/* ───────── Share-link index: token → orgId, so public links resolve without a session ───────── */

function shares() {
  state.shares ??= fs
    .readFile(SHARES_FILE, "utf8")
    .then((s) => new Map(Object.entries(JSON.parse(s) as Record<string, string>)))
    .catch(() => new Map<string, string>());
  return state.shares;
}

let shareWrites: Promise<void> = Promise.resolve();
export async function indexShare(token: string, orgId: string | null) {
  const map = await shares();
  if (orgId) map.set(token, orgId);
  else map.delete(token);
  shareWrites = shareWrites.then(() => writeAtomic(SHARES_FILE, Object.fromEntries(map))).catch(() => {});
  await shareWrites;
}

export async function findShared(token: string) {
  const orgId = (await shares()).get(token);
  if (!orgId) return null;
  const db = await load(orgId);
  const record = db.research.find((r) => r.shareToken === token);
  return record ? { db, record } : null;
}
