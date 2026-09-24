import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowUpRight, Lock } from "lucide-react";
import { ResearchView } from "@/components/research/research-view";
import { LinkButton, Logo } from "@/components/ui";
import { readDb } from "@/lib/store";

export const dynamic = "force-dynamic";

async function find(token: string) {
  // Tokens are 16+ chars of base64url; reject anything else before touching the store.
  if (!/^[\w-]{12,64}$/.test(token)) return null;
  return (await readDb()).research.find((r) => r.shareToken === token) ?? null;
}

export async function generateMetadata({ params }: PageProps<"/share/[token]">) {
  const r = await find((await params).token);
  return { title: r ? r.title : "Report not found", robots: { index: false, follow: false } };
}

export default async function SharedReport({ params }: PageProps<"/share/[token]">) {
  const record = await find((await params).token);
  if (!record) notFound();
  const db = await readDb();
  return (
    <div className="min-h-screen bg-grid">
      <header className="no-print sticky top-0 z-20 border-b border-line bg-base/80 backdrop-blur">
        <div className="mx-auto flex max-w-[1240px] items-center justify-between gap-4 px-5 py-3 sm:px-8">
          <Link href="/"><Logo size="sm" /></Link>
          <div className="hidden items-center gap-2 font-mono text-[10.5px] tracking-[0.16em] text-muted uppercase sm:flex">
            <Lock className="h-3 w-3 text-lime" /> Shared by {db.workspace.name} · read-only
          </div>
          <LinkButton href="/" variant="ghost" size="sm">
            What is Cairn <ArrowUpRight className="h-3.5 w-3.5" />
          </LinkButton>
        </div>
      </header>
      <main className="mx-auto max-w-[1240px] px-5 py-10 sm:px-8">
        <ResearchView record={record} readonly />
      </main>
    </div>
  );
}
