"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  Check,
  Columns3,
  FileSearch,
  ListChecks,
  Loader2,
  MessageSquareQuote,
  Scale,
  Sparkles,
  Target,
  X,
} from "lucide-react";
import { Button, cx, DocIcon, Label, Tag } from "@/components/ui";
import type { DocRecord, ResearchMode } from "@/lib/types";

const MODES = [
  {
    id: "ask" as const,
    label: "Answer",
    icon: MessageSquareQuote,
    desc: "A direct, cited answer with key points and confidence.",
    placeholder: "e.g. What did UK pilot customers say about pricing?",
  },
  {
    id: "compare" as const,
    label: "Compare",
    icon: Columns3,
    desc: "A side-by-side evidence table. Every cell cited.",
    placeholder: "e.g. Which market is the better first expansion target?",
  },
  {
    id: "brief" as const,
    label: "Decision brief",
    icon: Scale,
    desc: "Options, evidence, risks and a recommendation.",
    placeholder: "e.g. Should we expand into the UK or Germany first?",
  },
];

const STAGES = [
  { icon: Target, label: "Framing the question" },
  { icon: FileSearch, label: "Retrieving passages" },
  { icon: Sparkles, label: "Synthesising" },
  { icon: ListChecks, label: "Verifying citations" },
];

export function Composer({
  docs,
  initial,
  ai,
}: {
  docs: Pick<DocRecord, "id" | "name" | "kind" | "category">[];
  initial: { mode: ResearchMode; q: string; subjects: string[]; run: boolean; docId?: string };
  ai: boolean;
}) {
  const router = useRouter();
  const [mode, setMode] = useState<ResearchMode>(initial.mode);
  const [question, setQuestion] = useState(initial.q);
  const [subjects, setSubjects] = useState<string[]>(initial.subjects);
  const [draft, setDraft] = useState("");
  const [scope, setScope] = useState<string[]>(initial.docId ? [initial.docId] : []);
  const [running, setRunning] = useState(false);
  const [stage, setStage] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const autoRan = useRef(false);

  const addSubject = (v: string) => {
    const parts = v.split(",").map((s) => s.trim()).filter(Boolean);
    if (parts.length) setSubjects((s) => [...new Set([...s, ...parts])].slice(0, 5));
    setDraft("");
  };

  const run = async () => {
    const pending = draft.trim() ? [...subjects, draft.trim()] : subjects;
    if (draft.trim()) addSubject(draft);
    if (!question.trim()) return setError("Enter a question first.");
    if (mode === "compare" && pending.length < 2) return setError("Add at least two things to compare.");
    setError(null);
    setRunning(true);
    setStage(0);
    // Stage timing is cosmetic; the server does the real work in one request.
    const pace = ai ? [700, 1400, 9000] : [300, 500, 500];
    let t = 0;
    const timers = pace.map((ms, i) => setTimeout(() => setStage(i + 1), (t += ms)));
    try {
      const res = await fetch("/api/research", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ mode, question, docIds: scope, subjects: mode === "brief" || mode === "compare" ? pending : [] }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Research failed");
      timers.forEach(clearTimeout);
      setStage(STAGES.length);
      router.push(`/app/research/${json.record.id}`);
      router.refresh();
    } catch (e) {
      timers.forEach(clearTimeout);
      setError(e instanceof Error ? e.message : "Research failed");
      setRunning(false);
    }
  };

  useEffect(() => {
    if (initial.run && initial.q && !autoRan.current) {
      autoRan.current = true;
      // Drop run=1 so Back doesn't trigger a second run.
      const url = new URL(window.location.href);
      url.searchParams.delete("run");
      window.history.replaceState(window.history.state, "", url);
      run();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const current = MODES.find((m) => m.id === mode)!;

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="space-y-5">
        <div className="grid gap-3 sm:grid-cols-3">
          {MODES.map((m) => (
            <button
              key={m.id}
              disabled={running}
              onClick={() => setMode(m.id)}
              className={cx(
                "panel p-4 text-left transition-all",
                mode === m.id ? "!border-lime/50 shadow-[0_0_0_1px_rgb(215_242_92/0.25)]" : "hover:!border-line-strong",
              )}
            >
              <div className="flex items-center justify-between">
                <m.icon className={cx("h-4.5 w-4.5", mode === m.id ? "text-lime" : "text-muted")} strokeWidth={1.7} />
                <span
                  className={cx(
                    "h-3.5 w-3.5 rounded-full border",
                    mode === m.id ? "border-lime bg-lime shadow-[inset_0_0_0_3px_var(--color-panel)]" : "border-line-strong",
                  )}
                />
              </div>
              <div className="mt-5 font-semibold">{m.label}</div>
              <div className="mt-1 text-[12.5px] leading-snug text-muted">{m.desc}</div>
            </button>
          ))}
        </div>

        <div className="panel p-5">
          <Label className="mb-3">{mode === "brief" ? "Decision" : "Research question"}</Label>
          <textarea
            value={question}
            disabled={running}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) run();
            }}
            rows={3}
            placeholder={current.placeholder}
            className="w-full resize-none bg-transparent text-[18px] leading-relaxed text-fg placeholder:text-dim focus:outline-none"
          />

          {(mode === "compare" || mode === "brief") && (
            <div className="mt-4 border-t border-line pt-4">
              <Label className="mb-3">
                {mode === "compare" ? "Compare these (2–5)" : "Options to weigh (optional)"}
              </Label>
              <div className="flex flex-wrap items-center gap-2">
                {subjects.map((s) => (
                  <span
                    key={s}
                    className="inline-flex h-8 items-center gap-1.5 rounded-full border border-lime/35 bg-lime/[0.07] pl-3 pr-1.5 text-[13px] text-lime"
                  >
                    {s}
                    <button
                      disabled={running}
                      onClick={() => setSubjects((x) => x.filter((y) => y !== s))}
                      className="grid h-5 w-5 place-items-center rounded-full hover:bg-lime/20"
                      aria-label={`Remove ${s}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
                <input
                  value={draft}
                  disabled={running}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === ",") {
                      e.preventDefault();
                      addSubject(draft);
                    } else if (e.key === "Backspace" && !draft) setSubjects((s) => s.slice(0, -1));
                  }}
                  onBlur={() => draft && addSubject(draft)}
                  placeholder={subjects.length ? "Add another…" : mode === "compare" ? "e.g. UK, Germany" : "e.g. UK first, Germany first"}
                  className="h-8 min-w-[160px] flex-1 bg-transparent text-[14px] placeholder:text-dim focus:outline-none"
                />
              </div>
            </div>
          )}

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
            <span className="font-mono text-[10.5px] text-dim">
              {scope.length ? `${scope.length} of ${docs.length} documents` : `All ${docs.length} documents`} ·{" "}
              {ai ? "Claude" : "Extractive mode"} · Ctrl+Enter
            </span>
            <Button onClick={run} disabled={running || !question.trim()} size="lg">
              {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <current.icon className="h-4 w-4" />}
              {running ? "Researching…" : `Run ${current.label.toLowerCase()}`}
            </Button>
          </div>
        </div>

        {error && (
          <div className="flex items-start gap-3 rounded-2xl border border-rose/30 bg-rose/[0.06] px-4 py-3 text-[14px] text-rose">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> {error}
          </div>
        )}

        {running && (
          <div className="panel animate-rise p-5">
            <div className="mb-5 flex items-center justify-between">
              <Label className="flex items-center gap-2 !text-soft">
                <span className="h-1.5 w-1.5 animate-pulse-soft rounded-full bg-lime" /> Research run
              </Label>
              <Tag tone="lime">In progress</Tag>
            </div>
            <div className="mb-6 grid grid-cols-4 gap-2">
              {STAGES.map((s, i) => (
                <div key={s.label} className="h-[3px] overflow-hidden rounded bg-line">
                  <div
                    className={cx(
                      "h-full bg-lime transition-all duration-700",
                      i < stage ? "w-full" : i === stage ? "w-1/2 animate-pulse-soft" : "w-0",
                    )}
                  />
                </div>
              ))}
            </div>
            <ul className="space-y-3.5">
              {STAGES.map((s, i) => {
                const st = i < stage ? "complete" : i === stage ? "active" : "pending";
                return (
                  <li key={s.label} className="flex items-center gap-3">
                    {st === "complete" ? (
                      <Check className="h-4 w-4 text-lime" />
                    ) : st === "active" ? (
                      <Loader2 className="h-4 w-4 animate-spin text-lime" />
                    ) : (
                      <s.icon className="h-4 w-4 text-dim" strokeWidth={1.7} />
                    )}
                    <span className={cx("flex-1 text-[14px]", st === "pending" ? "text-dim" : "text-fg")}>{s.label}</span>
                    <span className={cx("font-mono text-[9.5px] uppercase tracking-[0.16em]", st === "active" ? "text-lime" : "text-dim")}>
                      {st}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>

      <aside className="panel h-fit">
        <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
          <div className="label">Scope</div>
          {scope.length > 0 && (
            <button onClick={() => setScope([])} className="label !text-lime hover:underline" disabled={running}>
              Use all
            </button>
          )}
        </div>
        <ul className="scroll-thin max-h-[440px] overflow-y-auto p-2">
          {docs.map((d) => {
            const on = scope.includes(d.id);
            return (
              <li key={d.id}>
                <button
                  disabled={running}
                  onClick={() => setScope((s) => (on ? s.filter((x) => x !== d.id) : [...s, d.id]))}
                  className={cx(
                    "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors",
                    on ? "bg-raise" : "hover:bg-panel-2",
                  )}
                >
                  <span
                    className={cx(
                      "grid h-4 w-4 shrink-0 place-items-center rounded border",
                      on ? "border-lime bg-lime text-lime-ink" : scope.length ? "border-line-strong" : "border-lime/40",
                    )}
                  >
                    {(on || !scope.length) && <Check className={cx("h-3 w-3", !on && "text-lime/60")} strokeWidth={3} />}
                  </span>
                  <DocIcon kind={d.kind} className="shrink-0 text-muted" />
                  <span className="truncate text-[13px] text-soft">{d.name}</span>
                </button>
              </li>
            );
          })}
        </ul>
        <p className="border-t border-line px-5 py-3 text-[12px] leading-relaxed text-dim">
          Only the most relevant passages from these documents are sent for synthesis.
        </p>
      </aside>
    </div>
  );
}
