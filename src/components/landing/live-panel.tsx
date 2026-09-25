"use client";

import { useEffect, useState } from "react";
import { FileSearch, ListChecks, ScanText, Sparkles } from "lucide-react";
import { cx } from "@/components/ui";

const STEPS = [
  { icon: ScanText, text: "parsed 5 sources" },
  { icon: FileSearch, text: "retrieved 14 passages" },
  { icon: Sparkles, text: "drafting brief" },
  { icon: ListChecks, text: "citation check" },
];

/** The hero's "live production" card, re-cast as a research run that loops. */
export function LivePanel() {
  const [step, setStep] = useState(2);
  useEffect(() => {
    const t = setInterval(() => setStep((s) => (s + 1) % (STEPS.length + 1)), 2200);
    return () => clearInterval(t);
  }, []);
  const status = (i: number) => (i < step ? "complete" : i === step ? "active" : "pending");
  const done = step >= STEPS.length;

  return (
    <div className="w-full">
      <div className="panel overflow-hidden shadow-[0_40px_120px_-40px_rgb(0_0_0/0.9)]">
        <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
          <div className="label flex items-center gap-2 !text-soft">
            <span className="h-1.5 w-1.5 rounded-full bg-lime animate-pulse-soft" /> Live research
          </div>
          <div className="label">Run / 014</div>
        </div>
        <div className="grid md:grid-cols-[1fr_1.1fr]">
          <div className="border-b border-line p-5 md:border-b-0 md:border-r">
            <div className="label mb-5">Analyst activity</div>
            <ul className="space-y-4">
              {STEPS.map((s, i) => {
                const st = status(i);
                return (
                  <li key={s.text} className="flex items-start gap-3">
                    <s.icon
                      className={cx("mt-0.5 h-4 w-4 shrink-0", st === "pending" ? "text-dim" : "text-lime")}
                      strokeWidth={1.7}
                    />
                    <span className={cx("flex-1 text-[14px] leading-snug", st === "pending" ? "text-dim" : "text-fg")}>
                      {s.text}
                    </span>
                    <span
                      className={cx(
                        "font-mono text-[9px] tracking-[0.16em] uppercase pt-1",
                        st === "active" ? "text-lime" : "text-dim",
                      )}
                    >
                      {st}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
          <div className="p-5">
            <div className="mb-4 flex items-center justify-between">
              <div className="label">Current brief</div>
              <div className="font-mono text-[10px] text-lime">V3</div>
            </div>
            <div className="relative h-[196px] overflow-hidden rounded-xl border border-line-strong bg-[radial-gradient(70%_70%_at_50%_40%,rgb(215_242_92/0.06),transparent)] p-4">
              <span className="absolute right-3 top-3 rounded border border-lime/40 bg-lime/10 px-1.5 py-0.5 font-mono text-[9px] tracking-widest text-lime">
                BOARD
              </span>
              <div className="mt-5 space-y-2 pr-2 text-[12.5px] leading-snug">
                <p className="font-semibold text-fg">Launch UK first; stage Germany for H2 2027.</p>
                <p className="text-muted">
                  UK sales cycle 38 days <span className="cite">3</span> vs 74 in Germany{" "}
                  <span className="cite">1</span>. DATEV gap blocked 6 deals <span className="cite">5</span>.
                </p>
              </div>
              <div className="absolute inset-x-4 bottom-4">
                <div className="relative h-px overflow-hidden bg-line-strong">
                  <div className={cx("absolute inset-y-0 w-1/3 bg-lime", done ? "left-0 w-full" : "animate-scan")} />
                </div>
                <div className="mt-2 font-mono text-[9px] tracking-[0.2em] text-muted">SOURCE / CLAIM / CITATION</div>
              </div>
            </div>
          </div>
        </div>
        {/* Stats span the full card width so labels never get squeezed */}
        <div className="grid grid-cols-3 border-t border-line">
          {[
            ["Sources", "14", "text-fg"],
            ["Citations", done ? "Verified" : "Pending", done ? "text-lime" : "text-amber"],
            ["Confidence", "High", "text-fg"],
          ].map(([k, v, c]) => (
            <div key={k} className="min-w-0 border-r border-line px-5 py-3.5 last:border-r-0">
              <div className="font-mono text-[9px] tracking-[0.16em] text-muted uppercase">{k}</div>
              <div className={cx("mt-1 font-mono text-[12px] font-semibold uppercase", c)}>{v}</div>
            </div>
          ))}
        </div>
      </div>
      <div className="mt-3 text-right font-mono text-[9.5px] tracking-[0.22em] text-dim">
        REAL SOURCES / VISIBLE REASONING / DURABLE DECISIONS
      </div>
    </div>
  );
}
