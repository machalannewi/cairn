import Link from "next/link";
import { ArrowUpRight, BookmarkCheck, Link2, Plus } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { cx, LinkButton, MODE_META, Tag, timeAgo } from "@/components/ui";
import { requireWorkspace } from "@/lib/session";
import { listDocs, listResearch } from "@/lib/store";

export const metadata = { title: "Research" };

const TABS = [
  { id: "all", label: "All runs" },
  { id: "saved", label: "Saved" },
  { id: "shared", label: "Shared" },
] as const;

export default async function ResearchList({ searchParams }: PageProps<"/app/research">) {
  const sp = await searchParams;
  const tab = (TABS.find((t) => t.id === sp.tab)?.id ?? "all") as (typeof TABS)[number]["id"];
  const { orgId } = await requireWorkspace();
  const [research, docs] = await Promise.all([listResearch(orgId), listDocs(orgId)]);
  const counts = {
    all: research.length,
    saved: research.filter((r) => r.saved).length,
    shared: research.filter((r) => r.shareToken).length,
  };
  const list = research.filter((r) => (tab === "saved" ? r.saved : tab === "shared" ? r.shareToken : true));
  const docName = new Map(docs.map((d) => [d.id, d.name]));

  return (
    <>
      <PageHeader
        eyebrow="Research / Library"
        title="Research"
        description="Every answer, comparison and brief your workspace has produced — save the keepers, share the finished ones."
        actions={
          <LinkButton href="/app/new">
            <Plus className="h-4 w-4" /> New research
          </LinkButton>
        }
      />

      <div className="mb-5 flex gap-1 rounded-full border border-line bg-ink/50 p-1 w-fit">
        {TABS.map((t) => (
          <Link
            key={t.id}
            href={t.id === "all" ? "/app/research" : `/app/research?tab=${t.id}`}
            className={cx(
              "flex h-8 items-center gap-2 rounded-full px-4 text-[13px] transition-colors",
              tab === t.id ? "bg-raise text-fg" : "text-muted hover:text-soft",
            )}
          >
            {t.label}
            <span className={cx("font-mono text-[10px]", tab === t.id ? "text-lime" : "text-dim")}>{counts[t.id]}</span>
          </Link>
        ))}
      </div>

      {list.length === 0 ? (
        <div className="panel grid place-items-center px-6 py-20 text-center">
          <div className="label">Nothing here yet</div>
          <p className="mt-3 max-w-sm text-[15px] text-muted">
            {tab === "all"
              ? "Run your first question to start building a research trail."
              : tab === "saved"
                ? "Save a result to keep it here."
                : "Share a result to generate a read-only link."}
          </p>
          <LinkButton href="/app/new" className="mt-6">
            Start researching
          </LinkButton>
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {list.map((r) => {
            const meta = MODE_META[r.mode];
            const preview =
              r.result.mode === "ask"
                ? r.result.data.answer
                : r.result.mode === "compare"
                  ? r.result.data.takeaway
                  : r.result.data.recommendation;
            const docs = [...new Set(r.sources.map((s) => s.docId))];
            return (
              <Link key={r.id} href={`/app/research/${r.id}`} className="panel group flex flex-col p-5 transition hover:!border-line-strong">
                <div className="flex items-center gap-2">
                  <Tag tone={meta.tone}>{meta.label}</Tag>
                  {r.result.mode === "brief" && r.engine === "claude" && (
                    <Tag tone={r.result.data.verdict === "go" ? "lime" : r.result.data.verdict === "no-go" ? "rose" : "amber"}>
                      {r.result.data.verdict}
                    </Tag>
                  )}
                  <span className="ml-auto flex items-center gap-2 text-dim">
                    {r.saved && <BookmarkCheck className="h-3.5 w-3.5 text-lime" />}
                    {r.shareToken && <Link2 className="h-3.5 w-3.5 text-lime" />}
                  </span>
                </div>
                <h3 className="mt-4 text-[17px] font-semibold leading-snug group-hover:text-lime">{r.title}</h3>
                <p className="mt-2 line-clamp-2 text-[13.5px] leading-relaxed text-muted">
                  {preview.replace(/\[\d+\]/g, "").replace(/\*\*/g, "")}
                </p>
                <div className="mt-auto flex items-center gap-3 pt-5 font-mono text-[10.5px] text-dim">
                  <span>{timeAgo(r.createdAt)}</span>
                  {r.createdBy && <span>· {r.createdBy.name.split(" ")[0]}</span>}
                  <span>·</span>
                  <span className="truncate">
                    {docs.length} docs — {docs.slice(0, 2).map((d) => docName.get(d) ?? "deleted").join(", ")}
                    {docs.length > 2 ? "…" : ""}
                  </span>
                  <ArrowUpRight className="ml-auto h-4 w-4 shrink-0 opacity-0 transition group-hover:opacity-100 group-hover:text-lime" />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}
