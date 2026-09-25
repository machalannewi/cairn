import { Sidebar } from "@/components/app/sidebar";
import { aiEnabled } from "@/lib/engine";
import { requireWorkspace } from "@/lib/session";

// Workspace data lives on disk and changes on every upload — never prerender.
export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: LayoutProps<"/app">) {
  const { db, isAdmin } = await requireWorkspace();
  return (
    <div className="min-h-screen bg-grid">
      <Sidebar
        ai={aiEnabled()}
        isAdmin={isAdmin}
        counts={{ docs: db.docs.length, research: db.research.length }}
      />
      <main className="lg:pl-[256px]">
        <div className="mx-auto max-w-[1240px] px-5 py-8 sm:px-8 lg:py-10">{children}</div>
      </main>
    </div>
  );
}
