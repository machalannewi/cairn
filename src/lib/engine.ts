import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { nanoid } from "nanoid";
import { z } from "zod";
import { searchChunks, selectSources, tokenize } from "./search";
import { mutate, readDb } from "./store";
import type {
  Actor,
  AskResult,
  BriefResult,
  CompareResult,
  ResearchMode,
  ResearchRecord,
  ResearchResult,
  Source,
} from "./types";

export const MODEL = process.env.CAIRN_MODEL || "claude-opus-5";

export function aiEnabled() {
  return Boolean(process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN);
}

/* ───────────────────────── Schemas ───────────────────────── */

const AskSchema = z.object({
  answer: z.string().describe("Direct answer in markdown, 1–4 short paragraphs, with [n] citations after each claim"),
  keyPoints: z.array(z.string()).describe("3–5 crisp takeaways, each ending with [n] citations"),
  confidence: z.enum(["high", "medium", "low"]),
  gaps: z.array(z.string()).describe("What the sources do not cover or where they conflict"),
  followUps: z.array(z.string()).describe("3 sharp follow-up research questions"),
});

const CompareSchema = z.object({
  summary: z.string().describe("2–3 sentence overview with [n] citations"),
  subjects: z.array(z.string()),
  rows: z.array(
    z.object({
      dimension: z.string(),
      cells: z
        .array(z.object({ value: z.string(), citations: z.array(z.number()) }))
        .describe("One cell per subject, same order as subjects. Use 'Not in sources' when unknown."),
    }),
  ),
  takeaway: z.string().describe("Which subject leads and why, with [n] citations"),
});

const BriefSchema = z.object({
  decision: z.string().describe("The decision framed as a single question"),
  recommendation: z.string().describe("The recommended course of action in 2–3 sentences with [n] citations"),
  verdict: z.enum(["go", "no-go", "conditional"]),
  context: z.string().describe("Background the reader needs, 1 paragraph, with [n] citations"),
  options: z.array(
    z.object({ name: z.string(), summary: z.string(), pros: z.array(z.string()), cons: z.array(z.string()) }),
  ),
  evidence: z.array(z.object({ claim: z.string(), citations: z.array(z.number()) })),
  risks: z.array(
    z.object({ risk: z.string(), severity: z.enum(["high", "medium", "low"]), mitigation: z.string() }),
  ),
  nextSteps: z.array(z.string()),
});

/* ───────────────────────── Retrieval ───────────────────────── */

async function retrieve(orgId: string, mode: ResearchMode, question: string, docIds: string[], subjects: string[]) {
  const db = await readDb(orgId);
  const opts = { docIds, limit: 60 };
  let hits = searchChunks(question, db.chunks, db.docs, opts);
  if (mode === "compare" && subjects.length) {
    // Guarantee each subject gets its own evidence, then merge by best score.
    const per = subjects.flatMap((s) => searchChunks(`${s} ${question}`, db.chunks, db.docs, opts).slice(0, 6));
    hits = [...per, ...hits];
  }
  if (mode === "brief") {
    const extra = searchChunks(`${question} option risk cost payback constraint recommendation`, db.chunks, db.docs, opts);
    hits = [...hits, ...extra];
  }
  const seen = new Set<string>();
  hits = hits
    .sort((a, b) => b.score - a.score)
    .filter((h) => (seen.has(h.chunk.id) ? false : (seen.add(h.chunk.id), true)));
  const max = mode === "ask" ? 12 : 18;
  return selectSources(hits, max, mode === "ask" ? 5 : 6);
}

/* ───────────────────────── Claude ───────────────────────── */

const SYSTEM = `You are Cairn, a research analyst inside a company's private workspace. You answer strictly from the numbered source passages provided — never from outside knowledge.

Citation rules:
- Cite every factual claim with the passage number in square brackets, e.g. "UK sales cycles are 38 days [3]." Multiple: [2][5].
- Only cite numbers that exist in the provided passages. Never invent figures.
- If the passages do not support an answer, say so plainly and list the gap.
- Prefer specific numbers, dates, and names over generalities. Be concise and decision-oriented; write for an executive reader.`;

function passages(sources: Source[]) {
  return sources
    .map((s) => `<passage n="${s.n}" doc="${s.docName}" location="${s.location}">\n${s.text}\n</passage>`)
    .join("\n\n");
}

function prompt(mode: ResearchMode, question: string, subjects: string[]) {
  if (mode === "compare")
    return `Compare the following subjects: ${subjects.join(", ")}.
Research question: ${question}
Choose 5–8 dimensions that matter most for this question (e.g. market size, growth, pricing, sales cycle, risks). Keep each cell under 25 words.`;
  if (mode === "brief")
    return `Write a decision brief for leadership.
Decision: ${question}
Lay out 2–4 realistic options, the strongest evidence, the key risks with mitigations, and a clear recommendation. Evidence items must each carry citations.`;
  return `Question: ${question}`;
}

async function runClaude(mode: ResearchMode, question: string, subjects: string[], sources: Source[]) {
  const client = new Anthropic();
  const schema = mode === "compare" ? CompareSchema : mode === "brief" ? BriefSchema : AskSchema;
  const res = await client.beta.messages.parse({
    model: MODEL,
    max_tokens: 16000,
    // Server-side fallback: if a safety classifier declines, the API retries on a recommended model.
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    thinking: { type: "adaptive" },
    output_config: { effort: "medium", format: betaZodOutputFormat(schema) },
    system: SYSTEM,
    messages: [
      {
        role: "user",
        content: `<sources>\n${passages(sources)}\n</sources>\n\n${prompt(mode, question, subjects)}`,
      },
    ],
  });
  if (res.stop_reason === "refusal") throw new Error("The model declined this request. Try rephrasing the question.");
  if (res.stop_reason === "max_tokens") throw new Error("The response was cut off. Try a narrower question.");
  if (!res.parsed_output) throw new Error("Could not read the model's response. Please try again.");
  return { data: res.parsed_output as unknown, model: res.model };
}

/* ───────────────────────── Extractive fallback ───────────────────────── */

function sentences(sources: Source[]) {
  return sources.flatMap((s) =>
    s.text
      .replace(/\n+/g, " ")
      .split(/(?<=[.!?])\s+(?=[A-Z0-9“"])/)
      .map((t) => t.trim())
      .filter((t) => t.length > 30 && t.length < 400)
      .map((text) => ({ text, n: s.n })),
  );
}

function rank(list: { text: string; n: number }[], query: string) {
  const q = new Set(tokenize(query));
  return list
    .map((s) => {
      const toks = tokenize(s.text);
      const overlap = toks.filter((t) => q.has(t)).length;
      const numeric = /\d/.test(s.text) ? 0.5 : 0;
      return { ...s, overlap, score: overlap + numeric };
    })
    .filter((s) => s.overlap > 0)
    .sort((a, b) => b.score - a.score);
}

function extractive(mode: ResearchMode, question: string, subjects: string[], sources: Source[]): unknown {
  const all = sentences(sources);
  const top = rank(all, question);
  const uniq = (xs: typeof top) => {
    const seen = new Set<string>();
    return xs.filter((x) => (seen.has(x.text) ? false : (seen.add(x.text), true)));
  };

  if (mode === "compare") {
    const dims = [
      ["Market size", "market size € revenue spend"],
      ["Growth", "growth cagr growing annually"],
      ["Pricing", "price pricing per user month discount"],
      ["Sales cycle", "sales cycle days median"],
      ["Requirements", "require integration localisation residency"],
      ["Risks", "risk concern blocked churn"],
    ] as const;
    const rows = dims.map(([dimension, kw]) => ({
      dimension,
      cells: subjects.map((s) => {
        const mine = new Set(tokenize(s));
        const others = new Set(subjects.filter((o) => o !== s).flatMap((o) => tokenize(o)));
        // Prefer sentences that mention this subject and not the others.
        const hit = rank(all, kw)
          .map((x) => {
            const t = tokenize(x.text);
            const own = t.some((w) => mine.has(w));
            const rival = t.some((w) => others.has(w));
            return { ...x, fit: own ? x.score + (rival ? 0 : 2) : -1 };
          })
          .filter((x) => x.fit > 0)
          .sort((a, b) => b.fit - a.fit)[0];
        return hit ? { value: hit.text, citations: [hit.n] } : { value: "Not in sources", citations: [] };
      }),
    }));
    const r: CompareResult = {
      summary: `Side-by-side evidence for ${subjects.join(" vs ")}, pulled verbatim from your documents.`,
      subjects,
      rows,
      takeaway: "Extractive mode shows matching passages only. Add an Anthropic API key for a synthesised verdict.",
    };
    return r;
  }

  if (mode === "brief") {
    const ev = uniq(top).slice(0, 6);
    const risky = uniq(rank(all, "risk concern blocked require cost burn")).slice(0, 3);
    const r: BriefResult = {
      decision: question,
      recommendation:
        "Extractive mode assembles evidence but does not make a recommendation. Add an Anthropic API key to generate a reasoned verdict.",
      verdict: "conditional",
      context: ev.slice(0, 2).map((e) => `${e.text} [${e.n}]`).join(" "),
      options: subjects.map((s) => ({ name: s, summary: "", pros: [], cons: [] })),
      evidence: ev.map((e) => ({ claim: e.text, citations: [e.n] })),
      risks: risky.map((e) => ({ risk: `${e.text} [${e.n}]`, severity: "medium", mitigation: "—" })),
      nextSteps: ["Review the cited passages", "Add an API key to generate options and a recommendation"],
    };
    return r;
  }

  const best = uniq(top);
  const r: AskResult = {
    answer: best.length
      ? best.slice(0, 3).map((b) => `${b.text} [${b.n}]`).join(" ")
      : "No passages in your library match this question.",
    keyPoints: best.slice(3, 7).map((b) => `${b.text} [${b.n}]`),
    confidence: best.length > 4 ? "medium" : "low",
    gaps: ["Answer is extractive (verbatim passages). Add an Anthropic API key for synthesised answers."],
    followUps: [],
  };
  return r;
}

/* ───────────────────────── Citation hygiene ───────────────────────── */

/** Drop any [n] the model cited that isn't a real passage, so every link resolves. */
function clean<T>(value: T, max: number): T {
  const fix = (s: string) =>
    s.replace(/\[(\d+)\]/g, (m, n) => (Number(n) >= 1 && Number(n) <= max ? m : "")).replace(/\s+([.,;])/g, "$1");
  const walk = (v: unknown): unknown => {
    if (typeof v === "string") return fix(v);
    if (Array.isArray(v)) return v.map(walk);
    if (v && typeof v === "object") {
      const o: Record<string, unknown> = {};
      for (const [k, x] of Object.entries(v)) {
        o[k] = k === "citations" && Array.isArray(x) ? x.filter((n) => n >= 1 && n <= max) : walk(x);
      }
      return o;
    }
    return v;
  };
  return walk(value) as T;
}

function titleFor(mode: ResearchMode, question: string, subjects: string[]) {
  if (mode === "compare" && subjects.length) return subjects.join(" vs ");
  const t = question.replace(/\s+/g, " ").trim().replace(/[?.]$/, "");
  return t.length > 80 ? t.slice(0, 77) + "…" : t;
}

/* ───────────────────────── Entry point ───────────────────────── */

export async function runResearch(input: {
  orgId: string;
  by: Actor;
  mode: ResearchMode;
  question: string;
  docIds?: string[];
  subjects?: string[];
}): Promise<ResearchRecord> {
  const started = Date.now();
  const question = input.question.trim();
  const subjects = (input.subjects ?? []).map((s) => s.trim()).filter(Boolean);
  const docIds = input.docIds ?? [];
  const sources = await retrieve(input.orgId, input.mode, question, docIds, subjects);
  if (!sources.length) throw new Error("No matching passages found. Try different wording or upload more documents.");

  let data: unknown;
  let model: string | undefined;
  let engine: ResearchRecord["engine"] = "extractive";
  if (aiEnabled()) {
    ({ data, model } = await runClaude(input.mode, question, subjects, sources));
    engine = "claude";
  } else {
    data = extractive(input.mode, question, subjects, sources);
  }

  const result = { mode: input.mode, data: clean(data, sources.length) } as ResearchResult;
  const record: ResearchRecord = {
    id: nanoid(10),
    title: titleFor(input.mode, question, subjects),
    question,
    mode: input.mode,
    createdAt: new Date().toISOString(),
    docIds,
    subjects: subjects.length ? subjects : undefined,
    result,
    sources,
    engine,
    model,
    durationMs: Date.now() - started,
    saved: false,
    createdBy: input.by,
  };
  await mutate(input.orgId, (db) => {
    db.research.unshift(record);
  });
  return record;
}
