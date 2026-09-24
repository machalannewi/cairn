"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowUp, Columns3, MessageSquareQuote, Scale } from "lucide-react";
import { cx } from "@/components/ui";
import type { ResearchMode } from "@/lib/types";

const MODES: { id: ResearchMode; label: string; icon: typeof Scale; hint: string }[] = [
  { id: "ask", label: "Answer", icon: MessageSquareQuote, hint: "Ask anything about your documents…" },
  { id: "compare", label: "Compare", icon: Columns3, hint: "What should we compare, and on what?" },
  { id: "brief", label: "Brief", icon: Scale, hint: "What decision are you facing?" },
];

export function QuickAsk() {
  const router = useRouter();
  const [mode, setMode] = useState<ResearchMode>("ask");
  const [q, setQ] = useState("");
  const current = MODES.find((m) => m.id === mode)!;

  const go = () => {
    if (!q.trim()) return;
    const p = new URLSearchParams({ mode, q: q.trim() });
    if (mode !== "compare") p.set("run", "1");
    router.push(`/app/new?${p}`);
  };

  return (
    <div className="panel p-2 focus-within:border-line-strong">
      <div className="flex items-center gap-1 px-2 pt-1.5">
        {MODES.map((m) => (
          <button
            key={m.id}
            onClick={() => setMode(m.id)}
            className={cx(
              "flex h-8 items-center gap-1.5 rounded-full px-3 text-[13px] transition-colors",
              mode === m.id ? "bg-raise text-fg" : "text-muted hover:text-soft",
            )}
          >
            <m.icon className={cx("h-3.5 w-3.5", mode === m.id && "text-lime")} strokeWidth={1.8} />
            {m.label}
          </button>
        ))}
      </div>
      <div className="flex items-end gap-3 p-2">
        <textarea
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              go();
            }
          }}
          rows={2}
          placeholder={current.hint}
          className="min-h-[56px] flex-1 resize-none bg-transparent px-2 py-1.5 text-[16px] text-fg placeholder:text-dim focus:outline-none"
        />
        <button
          onClick={go}
          disabled={!q.trim()}
          aria-label="Run research"
          className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-lime text-lime-ink transition hover:bg-[#e2fa70] disabled:opacity-30"
        >
          <ArrowUp className="h-4.5 w-4.5" strokeWidth={2.2} />
        </button>
      </div>
    </div>
  );
}
