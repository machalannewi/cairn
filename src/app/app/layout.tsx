import { Sidebar } from "@/components/app/sidebar";
import { aiEnabled } from "@/lib/engine";
import { readDb } from "@/lib/store";

// Workspace data lives on disk and changes on every upload — never prerender.
export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: LayoutProps<"/app">) {
  const db = await readDb();
  return (
    <div className="min-h-screen bg-grid">
      <Sidebar
        workspace={db.workspace.name}
        focus={db.workspace.focus}
        ai={aiEnabled()}
        counts={{ docs: db.docs.length, research: db.research.length }}
      />
      <main className="lg:pl-[256px]">
        <div className="mx-auto max-w-[1240px] px-5 py-8 sm:px-8 lg:py-10">{children}</div>
      </main>
    </div>
  );
}
