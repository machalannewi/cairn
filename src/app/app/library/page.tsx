import { PageHeader } from "@/components/app/page-header";
import { ClearSamples, DocTable, LibrarySearch, Uploader } from "@/components/app/library-client";
import { requireWorkspace } from "@/lib/session";
import { counts, listDocs } from "@/lib/store";

export const metadata = { title: "Library" };

export default async function Library() {
  const { orgId, isAdmin } = await requireWorkspace();
  const [docs, c] = await Promise.all([listDocs(orgId), counts(orgId)]);
  const samples = docs.filter((d) => d.sample).length;
  return (
    <>
      <PageHeader
        eyebrow={`Library / ${c.docs} documents · ${c.chunks} passages`}
        title="Library"
        description="Upload reports, spreadsheets and meeting notes. Cairn splits them into citable passages and indexes them for search."
      />
      {isAdmin && samples > 0 && <ClearSamples count={samples} />}
      <div className="grid gap-6 lg:grid-cols-[1fr_1.15fr]">
        <Uploader />
        <LibrarySearch />
      </div>
      <div className="mt-6">
        <DocTable docs={docs} />
      </div>
    </>
  );
}
