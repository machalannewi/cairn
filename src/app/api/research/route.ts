import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { runResearch } from "@/lib/engine";
import { actor, apiWorkspace } from "@/lib/session";
import { readDb } from "@/lib/store";
import type { ResearchMode } from "@/lib/types";

export const maxDuration = 300;

export async function GET() {
  const ws = await apiWorkspace();
  if (ws instanceof NextResponse) return ws;
  return NextResponse.json({ research: (await readDb(ws.orgId)).research });
}

export async function POST(req: Request) {
  const ws = await apiWorkspace();
  if (ws instanceof NextResponse) return ws;
  const body = (await req.json().catch(() => ({}))) as {
    mode?: ResearchMode;
    question?: string;
    docIds?: string[];
    subjects?: string[];
  };
  const mode = body.mode ?? "ask";
  if (!["ask", "compare", "brief"].includes(mode))
    return NextResponse.json({ error: "Unknown mode" }, { status: 400 });
  if (!body.question?.trim()) return NextResponse.json({ error: "Enter a question" }, { status: 400 });
  if (mode === "compare" && (body.subjects?.filter((s) => s.trim()).length ?? 0) < 2)
    return NextResponse.json({ error: "Add at least two things to compare" }, { status: 400 });

  try {
    const record = await runResearch({
      orgId: ws.orgId,
      by: await actor(ws.userId),
      mode,
      question: body.question,
      docIds: body.docIds,
      subjects: body.subjects,
    });
    return NextResponse.json({ record });
  } catch (e) {
    if (e instanceof Anthropic.AuthenticationError)
      return NextResponse.json({ error: "Your Anthropic API key was rejected. Check ANTHROPIC_API_KEY." }, { status: 401 });
    if (e instanceof Anthropic.RateLimitError)
      return NextResponse.json({ error: "Rate limited by the model provider. Try again in a moment." }, { status: 429 });
    if (e instanceof Anthropic.APIError)
      return NextResponse.json({ error: `Model error: ${e.message}` }, { status: 502 });
    return NextResponse.json({ error: e instanceof Error ? e.message : "Research failed" }, { status: 500 });
  }
}
