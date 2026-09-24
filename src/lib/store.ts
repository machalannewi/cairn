import "server-only";
import { promises as fs } from "node:fs";
import path from "node:path";
import type { Database } from "./types";

/**
 * A small JSON-file store. Good enough for a single-workspace deployment and
 * trivially swappable for Postgres later — every read/write goes through here.
 */
const DATA_DIR = path.join(process.cwd(), "data");
const DB_FILE = path.join(DATA_DIR, "cairn.json");
export const UPLOAD_DIR = path.join(DATA_DIR, "uploads");

// Pages and route handlers can be bundled as separate module instances, so the
// cache lives on globalThis to guarantee one copy of the database per process.
type State = { db: Database | null; loading: Promise<Database> | null; writes: Promise<void> };
const g = globalThis as typeof globalThis & { __cairn?: State };
const state: State = (g.__cairn ??= { db: null, loading: null, writes: Promise.resolve() });

function empty(): Database {
  return {
    version: 1,
    workspace: { name: "My workspace", focus: "Market research", createdAt: new Date().toISOString() },
    docs: [],
    chunks: [],
    research: [],
  };
}

async function load(): Promise<Database> {
  if (state.db) return state.db;
  state.loading ??= (async () => {
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
    try {
      state.db = JSON.parse(await fs.readFile(DB_FILE, "utf8")) as Database;
    } catch {
      state.db = empty();
      // First boot: seed sample documents so the workspace is never empty.
      const { seedWorkspace } = await import("./seed");
      await seedWorkspace(state.db);
      await persist(state.db);
    }
    return state.db;
  })();
  return state.loading;
}

let n = 0;
async function persist(db: Database) {
  const tmp = `${DB_FILE}.${process.pid}.${n++}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(db));
  await fs.rename(tmp, DB_FILE);
}

export async function readDb(): Promise<Database> {
  return load();
}

/** Serialises writes so concurrent requests never clobber each other. */
export async function mutate<T>(fn: (db: Database) => T | Promise<T>): Promise<T> {
  const db = await load();
  let result!: T;
  const run = state.writes.then(async () => {
    result = await fn(db);
    await persist(db);
  });
  state.writes = run.catch(() => {});
  await run;
  return result;
}
