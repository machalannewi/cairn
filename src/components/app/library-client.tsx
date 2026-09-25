"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AlertTriangle, CheckCircle2, Loader2, Search, UploadCloud, X } from "lucide-react";
import { cx, DocIcon, formatBytes, kindLabel, Label, Tag, timeAgo } from "@/components/ui";
import type { DocKind, DocRecord } from "@/lib/types";

const ACCEPT = ".pdf,.docx,.xlsx,.xls,.csv,.md,.markdown,.txt";

type Upload = { name: string; state: "uploading" | "done" | "error"; message?: string; id?: string };
type Hit = { chunkId: string; docId: string; docName: string; kind: DocKind; location: string; snippet: string; score: number };

export function Uploader() {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);
  const [uploads, setUploads] = useState<Upload[]>([]);

  const send = async (files: File[]) => {
    if (!files.length) return;
    setUploads((u) => [...files.map((f) => ({ name: f.name, state: "uploading" as const })), ...u].slice(0, 8));
    const fd = new FormData();
    files.forEach((f) => fd.append("files", f));
    try {
      const res = await fetch("/api/documents", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      const results = json.results as { name: string; doc?: DocRecord; error?: string }[];
      setUploads((u) =>
        u.map((x) => {
          const r = results.find((y) => y.name === x.name && x.state === "uploading");
          if (!r) return x;
          return r.error
            ? { ...x, state: "error", message: r.error }
            : { ...x, state: "done", id: r.doc!.id, message: `${r.doc!.chunkCount} passages indexed` };
        }),
      );
      router.refresh();
    } catch (e) {
      setUploads((u) =>
        u.map((x) => (x.state === "uploading" ? { ...x, state: "error", message: e instanceof Error ? e.message : "Upload failed" } : x)),
      );
    }
  };

  return (
    <div>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          send([...e.dataTransfer.files]);
        }}
        onClick={() => input.current?.click()}
        className={cx(
          "group relative cursor-pointer overflow-hidden rounded-[18px] border border-dashed px-6 py-9 text-center transition-all",
          drag ? "border-lime bg-lime/[0.05]" : "border-line-strong bg-panel/60 hover:border-muted",
        )}
      >
        <input
          ref={input}
          type="file"
          multiple
          accept={ACCEPT}
          className="hidden"
          onChange={(e) => {
            send([...(e.target.files ?? [])]);
            e.target.value = "";
          }}
        />
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl border border-line-strong bg-ink text-lime transition group-hover:scale-105">
          <UploadCloud className="h-5 w-5" strokeWidth={1.6} />
        </div>
        <div className="mt-4 text-[15px] font-semibold">Drop files here or click to upload</div>
        <div className="mt-1 text-[13px] text-muted">PDF, Word, Excel, CSV, Markdown or text · up to 20 MB each</div>
        <div className="mt-4 flex justify-center gap-1.5">
          {["PDF", "DOCX", "XLSX", "CSV", "MD", "TXT"].map((k) => (
            <span key={k} className="rounded border border-line px-1.5 py-0.5 font-mono text-[9.5px] tracking-widest text-dim">
              {k}
            </span>
          ))}
        </div>
      </div>

      {uploads.length > 0 && (
        <ul className="mt-3 space-y-1.5">
          {uploads.map((u, i) => (
            <li key={i} className="flex items-center gap-3 rounded-xl border border-line bg-panel px-4 py-2.5 text-[13px] animate-rise">
              {u.state === "uploading" ? (
                <Loader2 className="h-4 w-4 animate-spin text-lime" />
              ) : u.state === "done" ? (
                <CheckCircle2 className="h-4 w-4 text-lime" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-rose" />
              )}
              {u.id ? (
                <Link href={`/app/library/${u.id}`} className="flex-1 truncate hover:text-lime">{u.name}</Link>
              ) : (
                <span className="flex-1 truncate">{u.name}</span>
              )}
              <span className={cx("font-mono text-[10.5px]", u.state === "error" ? "text-rose" : "text-dim")}>
                {u.state === "uploading" ? "Parsing & indexing…" : u.message}
              </span>
              {u.state !== "uploading" && (
                <button onClick={() => setUploads((x) => x.filter((_, j) => j !== i))} className="text-dim hover:text-fg" aria-label="Dismiss">
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function LibrarySearch() {
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<Hit[] | null>(null);
  const [loading, setLoading] = useState(false);

  const onChange = (v: string) => {
    setQ(v);
    setLoading(Boolean(v.trim()));
    if (!v.trim()) setHits(null);
  };

  useEffect(() => {
    if (!q.trim()) return;
    const ctl = new AbortController();
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`, { signal: ctl.signal });
        setHits((await res.json()).hits);
        setLoading(false);
      } catch {}
    }, 180);
    return () => {
      clearTimeout(t);
      ctl.abort();
    };
  }, [q]);

  const terms = q.toLowerCase().split(/\s+/).filter((t) => t.length > 2);
  const highlight = (s: string) => {
    if (!terms.length) return s;
    const re = new RegExp(`(${terms.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`, "gi");
    return s.split(re).map((p, i) => (i % 2 ? <mark key={i}>{p}</mark> : p));
  };

  return (
    <div>
      <div className="panel flex h-12 items-center gap-3 px-4 focus-within:!border-line-strong">
        <Search className="h-4 w-4 text-muted" />
        <input
          value={q}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Search every passage — e.g. DATEV, sales cycle, pricing"
          className="h-full flex-1 bg-transparent text-[15px] placeholder:text-dim focus:outline-none"
        />
        {loading && <Loader2 className="h-4 w-4 animate-spin text-lime" />}
        {q && !loading && (
          <button onClick={() => onChange("")} className="text-dim hover:text-fg" aria-label="Clear">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      {hits && (
        <div className="panel mt-3 animate-rise overflow-hidden">
          <div className="flex items-center justify-between border-b border-line px-5 py-3">
            <Label>{hits.length} passages</Label>
            {hits.length > 0 && (
              <Link
                href={`/app/new?${new URLSearchParams({ mode: "ask", q, run: "1" })}`}
                className="label !text-lime hover:underline"
              >
                Ask Cairn instead →
              </Link>
            )}
          </div>
          <ul className="scroll-thin max-h-[420px] divide-y divide-line overflow-y-auto">
            {hits.map((h) => (
              <li key={h.chunkId}>
                <Link href={`/app/library/${h.docId}#${h.chunkId}`} className="block px-5 py-3.5 hover:bg-panel-2/60">
                  <div className="flex items-center gap-2 text-[13px]">
                    <DocIcon kind={h.kind} className="text-lime" />
                    <span className="truncate font-medium">{h.docName}</span>
                    <span className="font-mono text-[10px] text-dim">{h.location}</span>
                    <span className="ml-auto font-mono text-[10px] text-dim">{h.score.toFixed(1)}</span>
                  </div>
                  <p className="mt-1.5 text-[13.5px] leading-relaxed text-muted">{highlight(h.snippet)}</p>
                </Link>
              </li>
            ))}
            {hits.length === 0 && <li className="px-5 py-6 text-[14px] text-muted">No passages match.</li>}
          </ul>
        </div>
      )}
    </div>
  );
}

export function DocTable({ docs }: { docs: DocRecord[] }) {
  const [filter, setFilter] = useState<string>("All");
  const cats = ["All", ...new Set(docs.map((d) => d.category))];
  const shown = filter === "All" ? docs : docs.filter((d) => d.category === filter);
  return (
    <div className="panel overflow-hidden">
      <div className="flex flex-wrap items-center gap-1 border-b border-line px-3 py-2.5">
        {cats.map((c) => (
          <button
            key={c}
            onClick={() => setFilter(c)}
            className={cx(
              "h-7 rounded-full px-3 text-[12.5px] transition-colors",
              filter === c ? "bg-raise text-fg" : "text-muted hover:text-soft",
            )}
          >
            {c}
          </button>
        ))}
      </div>
      <div className="scroll-thin overflow-x-auto">
        <table className="w-full min-w-[640px] text-left">
          <thead>
            <tr className="border-b border-line">
              {["Name", "Type", "Passages", "Size", "Added"].map((h) => (
                <th key={h} className="label px-5 py-3 font-normal">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {shown.map((d) => (
              <tr key={d.id} className="group border-b border-line last:border-0 hover:bg-panel-2/50">
                <td className="px-5 py-3.5">
                  <Link href={`/app/library/${d.id}`} className="flex items-center gap-3">
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-line bg-ink/60 text-soft group-hover:text-lime">
                      <DocIcon kind={d.kind} />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-[14px] group-hover:text-lime">{d.name}</span>
                      <span className="block text-[12px] text-dim">{d.category}{d.sample ? " · sample" : ""}</span>
                    </span>
                  </Link>
                </td>
                <td className="px-5"><Tag>{kindLabel(d.kind)}</Tag></td>
                <td className="px-5 font-mono text-[12px] text-soft">{d.chunkCount}</td>
                <td className="px-5 font-mono text-[12px] text-muted">{formatBytes(d.size)}</td>
                <td className="px-5 font-mono text-[12px] text-muted">
                  {timeAgo(d.uploadedAt)}
                  {d.uploadedBy && <span className="block text-[10.5px] text-dim">{d.uploadedBy.name}</span>}
                </td>
              </tr>
            ))}
            {shown.length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-10 text-center text-[14px] text-muted">No documents yet — upload some above.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/** Admin-only: remove the seeded Halden sample documents once the team has its own. */
export function ClearSamples({ count }: { count: number }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  return (
    <div className="mb-6 flex flex-wrap items-center gap-3 rounded-2xl border border-sky/25 bg-sky/[0.04] px-5 py-3.5 text-[13.5px]">
      <Tag tone="sky">Sample data</Tag>
      <span className="flex-1 text-soft">
        This workspace includes {count} sample documents about a fictional company, Halden, so you can try Cairn right away.
      </span>
      <button
        disabled={busy}
        onClick={async () => {
          if (!confirm("Remove all sample documents from this workspace?")) return;
          setBusy(true);
          await fetch("/api/documents?samples=1", { method: "DELETE" });
          router.refresh();
        }}
        className="flex items-center gap-2 font-mono text-[10.5px] uppercase tracking-[0.14em] text-sky hover:underline disabled:opacity-50"
      >
        {busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Remove samples
      </button>
    </div>
  );
}
