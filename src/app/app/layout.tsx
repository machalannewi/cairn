import { Sidebar } from "@/components/app/sidebar";
import { aiEnabled } from "@/lib/engine";
import { requireWorkspace } from "@/lib/session";
import { counts } from "@/lib/store";

// Workspace data changes on every upload and run — never prerender.
export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: LayoutProps<"/app">) {
  const { orgId, isAdmin } = await requireWorkspace();
  const c = await counts(orgId);
  return (
    <div className="min-h-screen bg-grid">
      <Sidebar
        ai={aiEnabled()}
        isAdmin={isAdmin}
        counts={{ docs: c.docs, research: c.research }}
      />
      <main className="lg:pl-[256px]">
        <div className="mx-auto max-w-[1240px] px-5 py-8 sm:px-8 lg:py-10">{children}</div>
      </main>
    </div>
  );
}
