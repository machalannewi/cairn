import "server-only";
import { auth, clerkClient, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
import { mutate, readDb } from "./store";
import type { Actor } from "./types";

export type Workspace = {
  orgId: string;
  userId: string;
  isAdmin: boolean;
};

async function resolve(): Promise<Workspace | null> {
  const { userId, orgId, has } = await auth();
  if (!userId || !orgId) return null;
  return { userId, orgId, isAdmin: has({ role: "org:admin" }) };
}

/** Org names only change via Clerk; cache briefly so pages don't hit the API every render. */
const names = new Map<string, { name: string; at: number }>();
async function orgName(orgId: string) {
  const hit = names.get(orgId);
  if (hit && Date.now() - hit.at < 5 * 60_000) return hit.name;
  try {
    const org = await (await clerkClient()).organizations.getOrganization({ organizationId: orgId });
    names.set(orgId, { name: org.name, at: Date.now() });
    return org.name;
  } catch {
    return hit?.name ?? "Workspace";
  }
}

/**
 * For pages: the active workspace, or a redirect to sign-in. The orgId always
 * comes from the verified session — never from the URL or request body.
 */
export async function requireWorkspace() {
  const ws = await resolve();
  if (!ws) redirect("/sign-in");
  const name = await orgName(ws.orgId);
  const db = await readDb(ws.orgId, name);
  // Keep the stored name in sync so public share pages can show it.
  if (db.workspace.name !== name) await mutate(ws.orgId, (d) => void (d.workspace.name = name));
  return { ...ws, db, name };
}

/** For route handlers: the workspace, or a JSON 401 to return as-is. */
export async function apiWorkspace(): Promise<Workspace | NextResponse> {
  const ws = await resolve();
  return ws ?? NextResponse.json({ error: "Sign in and choose a workspace first" }, { status: 401 });
}

export function forbidden(message = "Only workspace admins can do that") {
  return NextResponse.json({ error: message }, { status: 403 });
}

/** Display info for attribution ("Uploaded by …"). */
export async function actor(userId: string): Promise<Actor> {
  const u = await currentUser();
  const name =
    [u?.firstName, u?.lastName].filter(Boolean).join(" ") ||
    u?.username ||
    u?.primaryEmailAddress?.emailAddress.split("@")[0] ||
    "Teammate";
  return { id: userId, name };
}
