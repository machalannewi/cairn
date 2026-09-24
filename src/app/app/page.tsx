import Link from "next/link";
import { Activity, ArrowUpRight, FolderOpen, Lightbulb, Upload } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { QuickAsk } from "@/components/app/quick-ask";
import { clock, DocIcon, kindLabel, LinkButton, MODE_META, Panel, Tag, timeAgo } from "@/components/ui";
import { readDb } from "@/lib/store";

export const metadata = { title: "Overview" };

const SUGGESTED = [
  { mode: "brief", q: "Should Halden expand into the UK or Germany first in FY2027?" },
  { mode: "ask", q: "What did UK pilot customers say about pricing and what would block renewal?" },
  { mode: "ask", q: "Why are we losing deals in Germany?" },
  { mode: "compare", q: "Compare the UK and German markets for Halden's expansion", subjects: "UK,Germany" },
];

export default async function Overview() {
  const db = await readDb();
  const passages = db.chunks.length;
  const words = db.docs.reduce((s, d) => s + d.wordCount, 0);
  const shared = db.research.filter((r) => r.shareToken).length;
  const saved = db.research.filter((r) => r.saved).length;
  const hour = new Date().getHours();
  const greet = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <>
      <PageHeader
        eyebrow={`Overview / ${db.workspace.name}`}
        title={`${greet}.`}
        description="Ask a question, compare options, or draft a decision brief from your workspace."
        actions={
          <>
            <LinkButton href="/app/library" variant="ghost">
              <Upload className="h-4 w-4" /> Upload files
            </LinkButton>
          </>
        }
      />

      <QuickAsk />

      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          ["Documents", db.docs.length, `${words.toLocaleString()} words`],
          ["Passages indexed", passages, "BM25 · section-aware"],
          ["Research runs", db.research.length, `${saved} saved`],
          ["Shared reports", shared, shared ? "Live links" : "None yet"],
        ].map(([k, v, sub]) => (
          <div key={k as string} className="panel px-5 py-4">
            <div className="label">{k}</div>
            <div className="mt-2 text-[28px] font-bold tracking-tight">{v}</div>
            <div className="font-mono text-[10.5px] text-dim">{sub}</div>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.35fr_1fr]">
        <Panel
          title="Research ledger"
          icon={<Activity className="h-3.5 w-3.5" />}
          right={
            <Link href="/app/research" className="label !text-lime hover:underline">
              View all
            </Link>
          }
        >
          {db.research.length === 0 ? (
            <div className="p-5">
              <p className="text-[14px] text-muted">No research yet. Start with one of these:</p>
              <ul className="mt-4 space-y-2">
                {SUGGESTED.map((s) => {
                  const p = new URLSearchParams({ mode: s.mode, q: s.q });
                  if (s.subjects) p.set("subjects", s.subjects);
                  else p.set("run", "1");
                  return (
                    <li key={s.q}>
                      <Link
                        href={`/app/new?${p}`}
                        className="group flex items-center gap-3 rounded-xl border border-line bg-ink/40 px-4 py-3 transition hover:border-line-strong"
                      >
                        <Lightbulb className="h-4 w-4 shrink-0 text-lime" strokeWidth={1.7} />
                        <span className="flex-1 text-[14px] text-soft group-hover:text-fg">{s.q}</span>
                        <Tag tone={MODE_META[s.mode as "ask"].tone}>{MODE_META[s.mode as "ask"].label}</Tag>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : (
            <ol className="relative px-5 py-4">
              {db.research.slice(0, 7).map((r, i, arr) => (
                <li key={r.id} className="relative flex gap-4 pb-5 last:pb-1">
                  {i < arr.length - 1 && <span className="absolute left-[7px] top-5 bottom-0 w-px bg-line" />}
                  <span className="relative mt-1.5 h-[15px] w-[15px] shrink-0 rounded-full border border-dashed border-lime/60 bg-panel" />
                  <Link href={`/app/research/${r.id}`} className="group min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] tracking-[0.16em] text-muted uppercase">
                        {MODE_META[r.mode].label}
                        {r.shareToken ? " · shared" : r.saved ? " · saved" : ""}
                      </span>
                      <span className="ml-auto font-mono text-[10px] text-dim">{clock(r.createdAt)}</span>
                    </div>
                    <div className="mt-0.5 truncate text-[15px] text-fg group-hover:text-lime">{r.title}</div>
                    <div className="mt-0.5 font-mono text-[10.5px] text-dim">
                      {r.sources.length} sources · {(r.durationMs / 1000).toFixed(1)}s · {timeAgo(r.createdAt)}
                    </div>
                  </Link>
                </li>
              ))}
            </ol>
          )}
        </Panel>

        <Panel
          title="Library"
          icon={<FolderOpen className="h-3.5 w-3.5" />}
          right={
            <Link href="/app/library" className="label !text-lime hover:underline">
              Manage
            </Link>
          }
        >
          <ul className="divide-y divide-line">
            {db.docs.slice(0, 7).map((d) => (
              <li key={d.id}>
                <Link href={`/app/library/${d.id}`} className="group flex items-center gap-3 px-5 py-3.5 hover:bg-panel-2/60">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-line bg-ink/60 text-soft group-hover:text-lime">
                    <DocIcon kind={d.kind} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[14px]">{d.name}</div>
                    <div className="font-mono text-[10.5px] text-dim">
                      {kindLabel(d.kind)} · {d.category} · {d.chunkCount} passages
                    </div>
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-dim opacity-0 transition group-hover:opacity-100" />
                </Link>
              </li>
            ))}
            {db.docs.length === 0 && <li className="p-5 text-sm text-muted">No documents yet.</li>}
          </ul>
        </Panel>
      </div>
    </>
  );
}
