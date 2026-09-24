import { PageHeader } from "@/components/app/page-header";
import { DocTable, LibrarySearch, Uploader } from "@/components/app/library-client";
import { readDb } from "@/lib/store";

export const metadata = { title: "Library" };

export default async function Library() {
  const db = await readDb();
  return (
    <>
      <PageHeader
        eyebrow={`Library / ${db.docs.length} documents · ${db.chunks.length} passages`}
        title="Library"
        description="Upload reports, spreadsheets and meeting notes. Cairn splits them into citable passages and indexes them for search."
      />
      <div className="grid gap-6 lg:grid-cols-[1fr_1.15fr]">
        <Uploader />
        <LibrarySearch />
      </div>
      <div className="mt-6">
        <DocTable docs={db.docs} />
      </div>
    </>
  );
}
