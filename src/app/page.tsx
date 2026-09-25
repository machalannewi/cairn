import Link from "next/link";
import { Show, UserButton } from "@clerk/nextjs";
import {
  ArrowRight,
  ArrowUpRight,
  Columns3,
  FileCheck2,
  FolderLock,
  Link2,
  MessageSquareQuote,
  Play,
  Scale,
  ShieldCheck,
  Users,
  Workflow,
} from "lucide-react";
import { LivePanel } from "@/components/landing/live-panel";
import { Label, LinkButton, Logo, Tag } from "@/components/ui";

const JOURNEY = ["Ingest", "Index", "Retrieve", "Synthesise", "Cite", "Brief", "Share"];

export default function Landing() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-grid">
      <div className="glow pointer-events-none absolute inset-0" />

      {/* Capsule nav */}
      <header className="relative z-10 flex justify-center px-4 pt-5">
        <nav className="flex w-full max-w-4xl items-center gap-2 rounded-full border border-line bg-ink/70 py-2 pl-5 pr-2 backdrop-blur-md">
          <Link href="/" className="mr-4">
            <Logo />
          </Link>
          <div className="hidden flex-1 items-center gap-7 text-[14px] text-soft md:flex">
            <a href="#how" className="hover:text-fg">How it works</a>
            <a href="#modes" className="hover:text-fg">Research modes</a>
            <a href="#trust" className="hover:text-fg">Security</a>
            <a href="#roadmap" className="hover:text-fg">Roadmap</a>
          </div>
          <span className="ml-auto hidden items-center gap-2 text-[13px] text-soft sm:flex md:ml-0">
            <span className="h-1.5 w-1.5 rounded-full bg-lime" /> Private beta
          </span>
          <Show
            when="signed-in"
            fallback={
              <>
                <Link href="/sign-in" className="ml-4 hidden text-[14px] text-soft hover:text-fg sm:block">
                  Sign in
                </Link>
                <LinkButton href="/sign-up" variant="light" size="md" className="ml-3">
                  Get started <ArrowRight className="h-4 w-4" />
                </LinkButton>
              </>
            }
          >
            <LinkButton href="/app" variant="light" size="md" className="ml-3">
              Open workspace <ArrowRight className="h-4 w-4" />
            </LinkButton>
            <span className="ml-1 flex items-center pr-1">
              <UserButton />
            </span>
          </Show>
        </nav>
      </header>

      {/* Hero */}
      <section className="relative z-10 mx-auto grid max-w-6xl items-center gap-14 px-6 pb-20 pt-20 lg:grid-cols-[1.05fr_1fr] lg:pt-24">
        <div className="animate-rise">
          <Label accent className="mb-7">Private research engine / 01</Label>
          <h1 className="text-[56px] font-bold leading-[0.98] tracking-[-0.045em] sm:text-[76px]">
            Upload.
            <br />
            Ask.
            <br />
            <span className="relative inline-block">
              <span className="absolute -inset-x-3 inset-y-1 -rotate-[1.5deg] bg-lime" />
              <span className="relative text-lime-ink">Cite.</span>
            </span>
            <br />
            Decide.
          </h1>
          <p className="mt-8 max-w-lg text-[17px] leading-relaxed text-muted">
            Cairn turns your company&apos;s documents, spreadsheets and meeting notes into answers, comparisons and
            decision briefs — where every claim links back to the exact passage it came from.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <LinkButton href="/app/new" size="lg">
              Start researching <ArrowUpRight className="h-4 w-4" />
            </LinkButton>
            <LinkButton href="/app" variant="ghost" size="lg">
              <Play className="h-3.5 w-3.5 fill-current" /> Explore sample workspace
            </LinkButton>
          </div>
        </div>
        <div className="animate-rise [animation-delay:120ms]">
          <LivePanel />
        </div>
      </section>

      {/* Journey — mirrors the template's production timeline */}
      <section id="how" className="relative z-10 mx-auto max-w-6xl px-6 pb-20">
        <div className="panel p-7">
          <div className="flex items-start justify-between gap-4">
            <div>
              <Label className="mb-3 flex items-center gap-2">
                <Workflow className="h-3.5 w-3.5 text-lime" /> Research journey
              </Label>
              <h2 className="text-2xl font-semibold tracking-tight">From raw files to a board-ready brief</h2>
              <p className="mt-1.5 text-soft/80 text-[15px]">
                Every run is a visible pipeline — nothing is hidden behind a chat bubble.
              </p>
            </div>
            <Tag tone="lime" className="hidden sm:inline-flex">
              <span className="h-1.5 w-1.5 rounded-full bg-lime" /> Run complete
            </Tag>
          </div>
          <div className="mt-8 grid grid-cols-7 gap-2">
            {JOURNEY.map((s, i) => (
              <div key={s}>
                <div className={i === JOURNEY.length - 1 ? "h-[3px] rounded bg-lime/50" : "h-[3px] rounded bg-lime"} />
                <div className="mt-3 truncate font-mono text-[9.5px] tracking-[0.18em] text-muted uppercase">
                  {i === JOURNEY.length - 1 ? `Now / ${s}` : s}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Modes */}
      <section id="modes" className="relative z-10 mx-auto max-w-6xl px-6 pb-24">
        <Label accent className="mb-4">Three research modes</Label>
        <h2 className="max-w-2xl text-4xl font-bold tracking-[-0.03em]">
          Questions in. Evidence out. Every sentence accountable.
        </h2>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {[
            {
              icon: MessageSquareQuote,
              tag: "Answer",
              title: "Cited answers",
              body: "Ask anything across your library. Get a direct answer, key points and confidence — with numbered citations that open the source passage.",
            },
            {
              icon: Columns3,
              tag: "Compare",
              title: "Evidence tables",
              body: "Put markets, vendors or options side by side. Cairn picks the dimensions that matter and cites every cell.",
            },
            {
              icon: Scale,
              tag: "Brief",
              title: "Decision briefs",
              body: "Options, pros and cons, risks with mitigations, and a clear verdict. Share a read-only link with your board in one click.",
            },
          ].map((m) => (
            <div key={m.title} className="panel group p-6 transition-colors hover:border-line-strong">
              <div className="flex items-center justify-between">
                <m.icon className="h-5 w-5 text-lime" strokeWidth={1.6} />
                <span className="font-mono text-[10px] tracking-[0.2em] text-dim uppercase">{m.tag}</span>
              </div>
              <h3 className="mt-10 text-lg font-semibold">{m.title}</h3>
              <p className="mt-2 text-[14.5px] leading-relaxed text-muted">{m.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Trust */}
      <section id="trust" className="relative z-10 border-y border-line bg-ink/50">
        <div className="mx-auto grid max-w-6xl gap-10 px-6 py-20 md:grid-cols-[1fr_1.3fr]">
          <div>
            <Label accent className="mb-4">Built for private data</Label>
            <h2 className="text-3xl font-bold tracking-[-0.03em]">Your files stay yours.</h2>
            <p className="mt-4 text-muted leading-relaxed">
              Documents are parsed and indexed on your own server. Only the handful of passages relevant to a question
              are sent to the model — and the answer is constrained to those passages.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              [FolderLock, "Self-hosted index", "Files, chunks and research live in your deployment."],
              [FileCheck2, "Grounded by design", "Answers can only cite passages that were retrieved. Bad citations are stripped."],
              [ShieldCheck, "Minimal exposure", "~12 passages per question — never your whole library."],
              [Link2, "Revocable sharing", "Share links are unguessable and can be revoked instantly."],
            ].map(([Icon, t, d]) => {
              const I = Icon as typeof FolderLock;
              return (
                <div key={t as string} className="rounded-2xl border border-line bg-panel p-5">
                  <I className="h-4 w-4 text-lime" strokeWidth={1.7} />
                  <div className="mt-4 font-semibold">{t as string}</div>
                  <div className="mt-1 text-[13.5px] text-muted">{d as string}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Roadmap */}
      <section id="roadmap" className="relative z-10 mx-auto max-w-6xl px-6 py-24">
        <Label accent className="mb-4">Roadmap</Label>
        <div className="grid gap-4 md:grid-cols-3">
          {[
            ["Now", "lime", "Uploads, search, cited answers, comparisons, decision briefs, share links, team workspaces with roles"],
            ["Next", "amber", "Comments on briefs, activity feed, semantic search"],
            ["Later", "muted", "Google Drive, Notion, SharePoint and Slack connectors; scheduled re-runs"],
          ].map(([when, tone, what]) => (
            <div key={when} className="panel p-6">
              <Tag tone={tone as "lime"}>{when}</Tag>
              <p className="mt-5 text-[15px] leading-relaxed text-soft">{what}</p>
            </div>
          ))}
        </div>
        <div className="mt-16 flex flex-col items-center gap-6 text-center">
          <Users className="h-6 w-6 text-lime" strokeWidth={1.5} />
          <h2 className="text-4xl font-bold tracking-[-0.03em]">Make the next decision with receipts.</h2>
          <LinkButton href="/app" size="lg">
            Open the workspace <ArrowUpRight className="h-4 w-4" />
          </LinkButton>
        </div>
      </section>

      <footer className="relative z-10 border-t border-line">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
          <Logo size="sm" />
          <span className="font-mono text-[10px] tracking-[0.2em] text-dim">© 2026 CAIRN / PRIVATE BY DEFAULT</span>
        </div>
      </footer>
    </div>
  );
}
