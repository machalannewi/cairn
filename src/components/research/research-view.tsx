"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Bookmark,
  BookmarkCheck,
  Check,
  ChevronDown,
  Copy,
  Download,
  FileStack,
  Link2,
  Link2Off,
  Printer,
  Share2,
  Trash2,
} from "lucide-react";
import { Button, clock, cx, Label, MODE_META, Tag } from "@/components/ui";
import type { ResearchRecord } from "@/lib/types";
import { CiteContext } from "./cited";
import { ResultBody } from "./result-body";
import { toMarkdown } from "./to-markdown";

export function ResearchView({
  record,
  readonly,
  canManage,
}: {
  record: ResearchRecord;
  readonly?: boolean;
  /** Author or admin: may delete and revoke sharing. */
  canManage?: boolean;
}) {
  const [active, setActive] = useState<number | null>(null);
  const refs = useRef(new Map<number, HTMLLIElement>());

  const focus = useCallback((n: number) => {
    setActive(n);
    refs.current.get(n)?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, []);

  const meta = MODE_META[record.mode];
  const date = new Date(record.createdAt);

  return (
    <CiteContext.Provider value={{ active, focus }}>
      <div className="mb-8">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <Tag tone={meta.tone}>{meta.label}</Tag>
          <span className="label">Run / {record.id.slice(0, 6)}</span>
        </div>
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 max-w-3xl">
            <h1 className="text-[30px] font-bold leading-[1.1] tracking-[-0.035em] sm:text-[36px]">{record.title}</h1>
            {record.question.replace(/[?.]$/, "") !== record.title && <p className="mt-3 text-[15px] text-muted">“{record.question}”</p>}
            <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1 font-mono text-[10.5px] tracking-wide text-dim">
              <span>{date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })} · {clock(record.createdAt)}</span>
              {record.createdBy && <span>By {record.createdBy.name}</span>}
              <span>{record.sources.length} sources</span>
              <span>{new Set(record.sources.map((s) => s.docId)).size} documents</span>
              <span>{record.engine === "claude" ? record.model ?? "Claude" : "Extractive"}</span>
              <span>{(record.durationMs / 1000).toFixed(1)}s</span>
            </div>
          </div>
          {!readonly && <Actions record={record} canManage={!!canManage} />}
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
        <div className="min-w-0">
          <ResultBody result={record.result} readonly={readonly} extractive={record.engine === "extractive"} />
          {!readonly && <Notes record={record} />}
        </div>

        <aside className="xl:sticky xl:top-6 xl:h-[calc(100vh-48px)]">
          <div className="panel flex h-full max-h-[80vh] flex-col xl:max-h-none">
            <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
              <Label className="flex items-center gap-2">
                <FileStack className="h-3.5 w-3.5 text-lime" /> Evidence ledger
              </Label>
              <span className="label !text-lime">{record.sources.length}</span>
            </div>
            <ol className="scroll-thin flex-1 space-y-1 overflow-y-auto p-2">
              {record.sources.map((s) => {
                const on = active === s.n;
                return (
                  <li
                    key={s.n}
                    ref={(el) => {
                      if (el) refs.current.set(s.n, el);
                    }}
                    className={cx(
                      "rounded-xl border transition-colors",
                      on ? "border-lime/40 bg-lime/[0.04]" : "border-transparent hover:bg-panel-2",
                    )}
                  >
                    <button onClick={() => setActive(on ? null : s.n)} className="flex w-full items-start gap-3 p-3 text-left">
                      <span
                        className={cx(
                          "grid h-6 min-w-6 place-items-center rounded-md border font-mono text-[10.5px] font-semibold",
                          on ? "border-lime bg-lime text-lime-ink" : "border-line-strong text-lime",
                        )}
                      >
                        {s.n}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13px] text-fg">{s.docName}</span>
                        <span className="block font-mono text-[10px] text-dim">{s.location}</span>
                        {!on && <span className="mt-1 line-clamp-2 block text-[12.5px] leading-snug text-muted">{s.text}</span>}
                      </span>
                      <ChevronDown className={cx("mt-1 h-3.5 w-3.5 shrink-0 text-dim transition", on && "rotate-180")} />
                    </button>
                    {on && (
                      <div className="px-3 pb-3 pl-12">
                        <p className="whitespace-pre-line border-l-2 border-lime/50 pl-3 text-[13px] leading-relaxed text-soft">
                          {s.text}
                        </p>
                        {!readonly && (
                          <Link
                            href={`/app/library/${s.docId}#${s.chunkId}`}
                            className="mt-2 inline-block font-mono text-[10px] tracking-[0.14em] text-lime uppercase hover:underline"
                          >
                            Open in document →
                          </Link>
                        )}
                      </div>
                    )}
                  </li>
                );
              })}
            </ol>
          </div>
        </aside>
      </div>
    </CiteContext.Provider>
  );
}

function Actions({ record, canManage }: { record: ResearchRecord; canManage: boolean }) {
  const router = useRouter();
  const [saved, setSaved] = useState(record.saved);
  const [token, setToken] = useState(record.shareToken);
  const [shareOpen, setShareOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);
  const url = token && typeof window !== "undefined" ? `${window.location.origin}/share/${token}` : "";

  useEffect(() => {
    if (!shareOpen) return;
    const close = (e: KeyboardEvent) => e.key === "Escape" && setShareOpen(false);
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [shareOpen]);

  const toggleSave = async () => {
    setSaved(!saved);
    await fetch(`/api/research/${record.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ saved: !saved }),
    });
    router.refresh();
  };

  const share = async () => {
    setShareOpen(true);
    if (token) return;
    setBusy(true);
    const res = await fetch(`/api/research/${record.id}/share`, { method: "POST" });
    const json = await res.json();
    setToken(json.token);
    setSaved(true);
    setBusy(false);
    router.refresh();
  };

  const revoke = async () => {
    await fetch(`/api/research/${record.id}/share`, { method: "DELETE" });
    setToken(undefined);
    setShareOpen(false);
    router.refresh();
  };

  const download = () => {
    const blob = new Blob([toMarkdown(record)], { type: "text/markdown" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${record.title.replace(/[^\w\s-]/g, "").trim().replace(/\s+/g, "-").toLowerCase() || "cairn-report"}.md`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const remove = async () => {
    if (!confirm("Delete this research? This cannot be undone.")) return;
    await fetch(`/api/research/${record.id}`, { method: "DELETE" });
    router.push("/app/research");
    router.refresh();
  };

  return (
    <div className="no-print relative flex shrink-0 flex-wrap items-center gap-2">
      <Button variant="ghost" onClick={toggleSave} className={cx(saved && "!border-lime/40 !text-lime")}>
        {saved ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
        {saved ? "Saved" : "Save"}
      </Button>
      <Button variant="ghost" onClick={download} title="Download as Markdown">
        <Download className="h-4 w-4" />
      </Button>
      <Button variant="ghost" onClick={() => window.print()} title="Print or save as PDF">
        <Printer className="h-4 w-4" />
      </Button>
      {canManage && (
        <Button variant="ghost" onClick={remove} title="Delete" className="hover:!border-rose/50 hover:!text-rose">
          <Trash2 className="h-4 w-4" />
        </Button>
      )}
      <Button onClick={share}>
        <Share2 className="h-4 w-4" /> Share
      </Button>

      {shareOpen && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setShareOpen(false)} />
          <div className="panel absolute right-0 top-12 z-40 w-[360px] animate-rise p-5 shadow-2xl">
            <Label className="mb-1 flex items-center gap-2 !text-soft">
              <Link2 className="h-3.5 w-3.5 text-lime" /> Read-only link
            </Label>
            <p className="mb-4 text-[13px] text-muted">Anyone with this link can view this report and its sources. No sign-in required.</p>
            <div className="flex items-center gap-2 rounded-xl border border-line-strong bg-ink p-1.5 pl-3">
              <span className="flex-1 truncate font-mono text-[11.5px] text-soft">{busy ? "Creating link…" : url}</span>
              <Button
                size="sm"
                disabled={busy}
                onClick={async () => {
                  await navigator.clipboard.writeText(url);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1600);
                }}
              >
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? "Copied" : "Copy"}
              </Button>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <a href={url} target="_blank" rel="noreferrer" className="font-mono text-[10.5px] tracking-[0.14em] text-lime uppercase hover:underline">
                Preview →
              </a>
              {canManage && (
                <button onClick={revoke} className="flex items-center gap-1.5 text-[12.5px] text-muted hover:text-rose">
                  <Link2Off className="h-3.5 w-3.5" /> Revoke link
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function Notes({ record }: { record: ResearchRecord }) {
  const [notes, setNotes] = useState(record.notes ?? "");
  const [state, setState] = useState<"idle" | "saving" | "saved">("idle");
  const last = useRef(record.notes ?? "");
  const save = async () => {
    if (notes === last.current) return;
    setState("saving");
    await fetch(`/api/research/${record.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ notes }),
    });
    last.current = notes;
    setState("saved");
  };
  return (
    <section className="panel no-print mt-5 p-6">
      <div className="mb-3 flex items-center justify-between">
        <Label>Analyst notes</Label>
        <span className="font-mono text-[10px] text-dim">{state === "saving" ? "Saving…" : state === "saved" ? "Saved" : "Private"}</span>
      </div>
      <textarea
        value={notes}
        onChange={(e) => {
          setNotes(e.target.value);
          setState("idle");
        }}
        onBlur={save}
        rows={3}
        placeholder="Add context, caveats or decisions for your team…"
        className="w-full resize-y bg-transparent text-[14.5px] leading-relaxed text-soft placeholder:text-dim focus:outline-none"
      />
    </section>
  );
}
