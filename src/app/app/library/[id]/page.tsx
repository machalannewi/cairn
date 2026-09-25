import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, MessageSquareQuote, Scale } from "lucide-react";
import { DeleteDoc } from "@/components/app/delete-doc";
import { DocIcon, formatBytes, kindLabel, Label, LinkButton, Panel, Tag, timeAgo } from "@/components/ui";
import { requireWorkspace } from "@/lib/session";

export async function generateMetadata({ params }: PageProps<"/app/library/[id]">) {
  const { id } = await params;
  return { title: (await requireWorkspace()).db.docs.find((d) => d.id === id)?.name ?? "Document" };
}

export default async function DocPage({ params }: PageProps<"/app/library/[id]">) {
  const { id } = await params;
  const { db, isAdmin } = await requireWorkspace();
  const doc = db.docs.find((d) => d.id === id);
  if (!doc) notFound();
  const chunks = db.chunks.filter((c) => c.docId === id).sort((a, b) => a.index - b.index);
  const citedIn = db.research.filter((r) => r.sources.some((s) => s.docId === id));

  return (
    <>
      <Link href="/app/library" className="mb-6 inline-flex items-center gap-2 font-mono text-[10.5px] tracking-[0.16em] text-muted uppercase hover:text-lime">
        <ArrowLeft className="h-3.5 w-3.5" /> Library
      </Link>

      <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex min-w-0 items-start gap-4">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-line-strong bg-panel text-lime">
            <DocIcon kind={doc.kind} className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <div className="mb-2 flex flex-wrap gap-2">
              <Tag>{kindLabel(doc.kind)}</Tag>
              <Tag tone="lime">{doc.category}</Tag>
              {doc.sample && <Tag tone="sky">Sample</Tag>}
            </div>
            <h1 className="text-[26px] font-bold leading-tight tracking-[-0.03em] sm:text-[30px]">{doc.name}</h1>
            <div className="mt-2 flex flex-wrap gap-x-5 font-mono text-[10.5px] text-dim">
              <span>{formatBytes(doc.size)}</span>
              <span>{doc.wordCount.toLocaleString()} words</span>
              <span>{doc.chunkCount} passages</span>
              <span>
                Added {timeAgo(doc.uploadedAt)}
                {doc.uploadedBy ? ` by ${doc.uploadedBy.name}` : ""}
              </span>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {isAdmin && <DeleteDoc id={doc.id} />}
          <LinkButton href={`/app/new?mode=brief&doc=${doc.id}`} variant="ghost">
            <Scale className="h-4 w-4" /> Brief
          </LinkButton>
          <LinkButton href={`/app/new?mode=ask&doc=${doc.id}`}>
            <MessageSquareQuote className="h-4 w-4" /> Ask this document
          </LinkButton>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          {doc.sheets?.map((s) => (
            <Panel key={s.name} title={`Sheet · ${s.name}`} right={<span className="label">{s.rowCount} rows</span>}>
              <div className="scroll-thin overflow-x-auto">
                <table className="w-full text-left text-[12.5px]">
                  <thead>
                    <tr className="border-b border-line">
                      {s.columns.map((c) => (
                        <th key={c} className="whitespace-nowrap px-4 py-2.5 font-mono text-[10px] font-normal uppercase tracking-[0.12em] text-muted">{c}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {s.rows.map((r, i) => (
                      <tr key={i} className="border-b border-line/60 last:border-0">
                        {r.map((v, j) => (
                          <td key={j} className="whitespace-nowrap px-4 py-2 text-soft">{v}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {s.rowCount > s.rows.length && (
                <div className="border-t border-line px-4 py-2 font-mono text-[10.5px] text-dim">
                  Showing {s.rows.length} of {s.rowCount} rows — all rows are indexed
                </div>
              )}
            </Panel>
          ))}

          <Panel title="Indexed passages" right={<span className="label">{chunks.length}</span>}>
            <ol className="divide-y divide-line">
              {chunks.map((c) => (
                <li key={c.id} id={c.id} className="passage scroll-mt-6 px-5 py-4 transition-colors">
                  <div className="mb-1.5 flex items-center gap-3">
                    <span className="font-mono text-[10px] text-lime">#{String(c.index + 1).padStart(2, "0")}</span>
                    <span className="font-mono text-[10px] tracking-wide text-dim">{c.location}</span>
                  </div>
                  <p className="whitespace-pre-line text-[14px] leading-relaxed text-soft">{c.text}</p>
                </li>
              ))}
            </ol>
          </Panel>
        </div>

        <aside className="space-y-6">
          <Panel title="Cited in">
            {citedIn.length ? (
              <ul className="divide-y divide-line">
                {citedIn.slice(0, 8).map((r) => (
                  <li key={r.id}>
                    <Link href={`/app/research/${r.id}`} className="block px-5 py-3 text-[13.5px] text-soft hover:text-lime">
                      {r.title}
                      <span className="mt-0.5 block font-mono text-[10px] text-dim">
                        {r.sources.filter((s) => s.docId === id).length} passages cited · {timeAgo(r.createdAt)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="px-5 py-4 text-[13px] text-muted">Not cited in any research yet.</p>
            )}
          </Panel>
          <div className="panel p-5">
            <Label className="mb-2">Preview</Label>
            <p className="text-[13px] leading-relaxed text-muted">{doc.excerpt}…</p>
          </div>
        </aside>
      </div>
    </>
  );
}
