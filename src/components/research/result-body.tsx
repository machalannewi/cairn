"use client";

import Link from "next/link";
import { ArrowUpRight, CircleCheck, CircleDashed, HelpCircle, ShieldAlert, ThumbsDown, ThumbsUp } from "lucide-react";
import { cx, Label, Tag } from "@/components/ui";
import type { AskResult, BriefResult, CompareResult, ResearchResult } from "@/lib/types";
import { CiteList, Inline, Rich } from "./cited";

export function ResultBody({
  result,
  readonly,
  extractive,
}: {
  result: ResearchResult;
  readonly?: boolean;
  extractive?: boolean;
}) {
  if (result.mode === "compare") return <CompareView r={result.data} />;
  if (result.mode === "brief") return <BriefView r={result.data} extractive={extractive} />;
  return <AskView r={result.data} readonly={readonly} />;
}

const CONF = { high: "lime", medium: "amber", low: "rose" } as const;

function AskView({ r, readonly }: { r: AskResult; readonly?: boolean }) {
  return (
    <div className="space-y-5">
      <section className="panel p-6 sm:p-7">
        <div className="mb-5 flex items-center justify-between">
          <Label>Answer</Label>
          <Tag tone={CONF[r.confidence]}>Confidence · {r.confidence}</Tag>
        </div>
        <div className="text-[16.5px] [&_p]:!text-fg/90">
          <Rich text={r.answer} />
        </div>
      </section>

      {r.keyPoints.length > 0 && (
        <section className="panel p-6">
          <Label className="mb-4">Key points</Label>
          <ol className="space-y-3">
            {r.keyPoints.map((k, i) => (
              <li key={i} className="flex gap-4">
                <span className="mt-0.5 font-mono text-[11px] text-lime">{String(i + 1).padStart(2, "0")}</span>
                <span className="text-[15px] leading-relaxed text-soft">
                  <Inline text={k} />
                </span>
              </li>
            ))}
          </ol>
        </section>
      )}

      <div className="grid gap-5 md:grid-cols-2">
        {r.gaps.length > 0 && (
          <section className="panel p-6">
            <Label className="mb-4 flex items-center gap-2">
              <CircleDashed className="h-3.5 w-3.5 text-amber" /> Gaps & conflicts
            </Label>
            <ul className="space-y-2.5 text-[14px] leading-relaxed text-muted">
              {r.gaps.map((g, i) => (
                <li key={i}>
                  <Inline text={g} />
                </li>
              ))}
            </ul>
          </section>
        )}
        {r.followUps.length > 0 && (
          <section className="panel p-6">
            <Label className="mb-4 flex items-center gap-2">
              <HelpCircle className="h-3.5 w-3.5 text-lime" /> Follow-up questions
            </Label>
            <ul className="space-y-1.5">
              {r.followUps.map((f, i) =>
                readonly ? (
                  <li key={i} className="text-[14px] text-soft">{f}</li>
                ) : (
                  <li key={i}>
                    <Link
                      href={`/app/new?${new URLSearchParams({ mode: "ask", q: f, run: "1" })}`}
                      className="group -mx-2 flex items-start gap-2 rounded-lg px-2 py-1.5 text-[14px] text-soft hover:bg-panel-2 hover:text-fg"
                    >
                      <span className="flex-1">{f}</span>
                      <ArrowUpRight className="mt-0.5 h-3.5 w-3.5 text-dim group-hover:text-lime" />
                    </Link>
                  </li>
                ),
              )}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
}

function CompareView({ r }: { r: CompareResult }) {
  return (
    <div className="space-y-5">
      <section className="panel p-6">
        <Label className="mb-3">Summary</Label>
        <Rich text={r.summary} />
      </section>
      <section className="panel overflow-hidden">
        <div className="scroll-thin overflow-x-auto">
          <table className="w-full min-w-[520px] border-collapse text-left">
            <thead>
              <tr className="border-b border-line">
                <th className="label w-[130px] px-5 py-4 font-normal">Dimension</th>
                {r.subjects.map((s) => (
                  <th key={s} className="px-5 py-4 text-[15px] font-semibold">
                    <span className="mr-2 inline-block h-2 w-2 rounded-full bg-lime" />
                    {s}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {r.rows.map((row) => (
                <tr key={row.dimension} className="border-b border-line last:border-0 align-top">
                  <td className="px-5 py-4 font-mono text-[10.5px] uppercase tracking-[0.12em] text-muted">{row.dimension}</td>
                  {r.subjects.map((_, i) => {
                    const c = row.cells[i];
                    const missing = !c || /not in sources/i.test(c.value);
                    return (
                      <td key={i} className={cx("px-5 py-4 text-[14px] leading-relaxed", missing ? "text-dim italic" : "text-soft")}>
                        {c ? <Inline text={c.value} /> : "—"}
                        {c && <CiteList ns={c.citations} />}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <section className="rounded-[18px] border border-lime/30 bg-lime/[0.05] p-6">
        <Label accent className="mb-3">Takeaway</Label>
        <div className="text-[16px] [&_p]:!text-fg">
          <Rich text={r.takeaway} />
        </div>
      </section>
    </div>
  );
}

const VERDICT = {
  go: { label: "Go", tone: "lime" as const },
  conditional: { label: "Conditional go", tone: "amber" as const },
  "no-go": { label: "No-go", tone: "rose" as const },
};
const SEV = { high: "rose", medium: "amber", low: "muted" } as const;

function BriefView({ r, extractive }: { r: BriefResult; extractive?: boolean }) {
  const v = VERDICT[r.verdict];
  return (
    <div className="space-y-5">
      <section className="panel relative overflow-hidden p-6 sm:p-7">
        <div className="glow pointer-events-none absolute inset-0" />
        <div className="relative">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Label>Decision</Label>
            {extractive ? (
              <Tag className="!h-7 !px-3 !text-[11px]">Evidence only · no verdict</Tag>
            ) : (
            <Tag tone={v.tone} className="!h-7 !px-3 !text-[11px]">
              <span className={cx("h-1.5 w-1.5 rounded-full", { lime: "bg-lime", amber: "bg-amber", rose: "bg-rose" }[v.tone])} />
              Verdict · {v.label}
            </Tag>
            )}
          </div>
          <h2 className="mt-3 text-[22px] font-semibold leading-snug tracking-tight">{r.decision}</h2>
          <div className="mt-5 border-l-2 border-lime pl-5 text-[16.5px] [&_p]:!text-fg">
            <Label accent className="mb-2">Recommendation</Label>
            <Rich text={r.recommendation} />
          </div>
        </div>
      </section>

      {r.context && (
        <section className="panel p-6">
          <Label className="mb-3">Context</Label>
          <Rich text={r.context} />
        </section>
      )}

      {r.options.length > 0 && (
        <section>
          <Label className="mb-3 px-1">Options considered</Label>
          <div className={cx("grid gap-4", r.options.length >= 3 ? "lg:grid-cols-3" : "md:grid-cols-2")}>
            {r.options.map((o, i) => (
              <div key={o.name} className="panel p-5">
                <div className="font-mono text-[10px] tracking-[0.18em] text-dim">OPTION {String.fromCharCode(65 + i)}</div>
                <div className="mt-1.5 text-[16px] font-semibold">{o.name}</div>
                {o.summary && (
                  <p className="mt-2 text-[13.5px] leading-relaxed text-muted">
                    <Inline text={o.summary} />
                  </p>
                )}
                {o.pros.length > 0 && (
                  <ul className="mt-4 space-y-1.5">
                    {o.pros.map((p, j) => (
                      <li key={j} className="flex gap-2 text-[13.5px] leading-snug text-soft">
                        <ThumbsUp className="mt-0.5 h-3.5 w-3.5 shrink-0 text-lime" strokeWidth={1.8} />
                        <span><Inline text={p} /></span>
                      </li>
                    ))}
                  </ul>
                )}
                {o.cons.length > 0 && (
                  <ul className="mt-3 space-y-1.5">
                    {o.cons.map((p, j) => (
                      <li key={j} className="flex gap-2 text-[13.5px] leading-snug text-soft">
                        <ThumbsDown className="mt-0.5 h-3.5 w-3.5 shrink-0 text-rose" strokeWidth={1.8} />
                        <span><Inline text={p} /></span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {r.evidence.length > 0 && (
        <section className="panel p-6">
          <Label className="mb-4">Supporting evidence</Label>
          <ul className="divide-y divide-line">
            {r.evidence.map((e, i) => (
              <li key={i} className="flex gap-3 py-3 first:pt-0 last:pb-0">
                <CircleCheck className="mt-0.5 h-4 w-4 shrink-0 text-lime" strokeWidth={1.7} />
                <span className="text-[14.5px] leading-relaxed text-soft">
                  <Inline text={e.claim} />
                  <CiteList ns={e.citations} />
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="grid gap-5 md:grid-cols-[1.4fr_1fr]">
        {r.risks.length > 0 && (
          <section className="panel p-6">
            <Label className="mb-4 flex items-center gap-2">
              <ShieldAlert className="h-3.5 w-3.5 text-amber" /> Risks & mitigations
            </Label>
            <ul className="space-y-4">
              {r.risks.map((k, i) => (
                <li key={i}>
                  <div className="flex items-start gap-3">
                    <Tag tone={SEV[k.severity]} className="mt-0.5 shrink-0">{k.severity}</Tag>
                    <div>
                      <div className="text-[14.5px] leading-snug text-fg"><Inline text={k.risk} /></div>
                      {k.mitigation && k.mitigation !== "—" && (
                        <div className="mt-1 text-[13px] leading-relaxed text-muted">→ <Inline text={k.mitigation} /></div>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}
        {r.nextSteps.length > 0 && (
          <section className="panel p-6">
            <Label className="mb-4">Next steps</Label>
            <ol className="space-y-3">
              {r.nextSteps.map((s, i) => (
                <li key={i} className="flex gap-3 text-[14px] leading-snug text-soft">
                  <span className="grid h-5 w-5 shrink-0 place-items-center rounded-md border border-line-strong font-mono text-[10px] text-lime">
                    {i + 1}
                  </span>
                  <Inline text={s} />
                </li>
              ))}
            </ol>
          </section>
        )}
      </div>
    </div>
  );
}
