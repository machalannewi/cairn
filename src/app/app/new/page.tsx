import { Composer } from "@/components/app/composer";
import { PageHeader } from "@/components/app/page-header";
import { aiEnabled } from "@/lib/engine";
import { requireWorkspace } from "@/lib/session";
import type { ResearchMode } from "@/lib/types";

export const metadata = { title: "New research" };

export default async function NewResearch({ searchParams }: PageProps<"/app/new">) {
  const sp = await searchParams;
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";
  const modeParam = one(sp.mode);
  const mode: ResearchMode = modeParam === "compare" || modeParam === "brief" ? modeParam : "ask";
  const db = (await requireWorkspace()).db;

  return (
    <>
      <PageHeader
        eyebrow="Research / New"
        title="What do you need to know?"
        description="Pick a mode, ask in plain language, and Cairn will answer from your documents only — with citations."
      />
      <Composer
        // Remount when arriving from a different quick-ask so state resets.
        key={JSON.stringify(sp)}
        ai={aiEnabled()}
        docs={db.docs.map(({ id, name, kind, category }) => ({ id, name, kind, category }))}
        initial={{
          mode,
          q: one(sp.q),
          subjects: one(sp.subjects).split(",").map((s) => s.trim()).filter(Boolean),
          run: one(sp.run) === "1",
          docId: one(sp.doc) || undefined,
        }}
      />
    </>
  );
}
