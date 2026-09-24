import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { ResearchView } from "@/components/research/research-view";
import { readDb } from "@/lib/store";

export async function generateMetadata({ params }: PageProps<"/app/research/[id]">) {
  const { id } = await params;
  const r = (await readDb()).research.find((x) => x.id === id);
  return { title: r?.title ?? "Research" };
}

export default async function ResearchPage({ params }: PageProps<"/app/research/[id]">) {
  const { id } = await params;
  const record = (await readDb()).research.find((x) => x.id === id);
  if (!record) notFound();
  return (
    <>
      <Link href="/app/research" className="no-print mb-6 inline-flex items-center gap-2 font-mono text-[10.5px] tracking-[0.16em] text-muted uppercase hover:text-lime">
        <ArrowLeft className="h-3.5 w-3.5" /> All research
      </Link>
      <ResearchView record={record} />
    </>
  );
}
