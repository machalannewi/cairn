"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  BookMarked,
  Cable,
  FolderOpen,
  LayoutGrid,
  Lock,
  Menu,
  Plus,
  Settings2,
  Users,
  X,
} from "lucide-react";
import { cx, LinkButton, Logo } from "@/components/ui";

const NAV = [
  { href: "/app", label: "Overview", icon: LayoutGrid, exact: true },
  { href: "/app/library", label: "Library", icon: FolderOpen },
  { href: "/app/research", label: "Research", icon: BookMarked },
  { href: "/app/settings", label: "Settings", icon: Settings2 },
];

export function Sidebar({
  workspace,
  focus,
  ai,
  counts,
}: {
  workspace: string;
  focus: string;
  ai: boolean;
  counts: { docs: number; research: number };
}) {
  const path = usePathname();
  const [open, setOpen] = useState(false);

  const body = (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between px-5 pt-5">
        <Link href="/" onClick={() => setOpen(false)}>
          <Logo />
        </Link>
        <button className="text-muted lg:hidden" onClick={() => setOpen(false)} aria-label="Close menu">
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="mx-4 mt-7 rounded-2xl border border-line bg-ink/50 p-3.5">
        <div className="flex items-center gap-3">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-raise font-mono text-xs font-semibold text-lime">
            {workspace.slice(0, 1)}
          </div>
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold">{workspace}</div>
            <div className="truncate text-[11.5px] text-muted">{focus}</div>
          </div>
        </div>
      </div>

      <div className="px-4 pt-4">
        <LinkButton href="/app/new" className="w-full" onClick={() => setOpen(false)}>
          <Plus className="h-4 w-4" /> New research
        </LinkButton>
      </div>

      <nav className="mt-6 space-y-0.5 px-3">
        <div className="label px-2 pb-2">Workspace</div>
        {NAV.map((n) => {
          const active = n.exact ? path === n.href : path.startsWith(n.href);
          const count = n.href === "/app/library" ? counts.docs : n.href === "/app/research" ? counts.research : null;
          return (
            <Link
              key={n.href}
              href={n.href}
              onClick={() => setOpen(false)}
              className={cx(
                "group flex h-10 items-center gap-3 rounded-xl px-3 text-[14px] transition-colors",
                active ? "bg-raise text-fg" : "text-soft hover:bg-panel-2 hover:text-fg",
              )}
            >
              <n.icon className={cx("h-4 w-4", active ? "text-lime" : "text-muted group-hover:text-soft")} strokeWidth={1.7} />
              <span className="flex-1">{n.label}</span>
              {count !== null && <span className="font-mono text-[10.5px] text-dim">{count}</span>}
            </Link>
          );
        })}
      </nav>

      <nav className="mt-6 space-y-0.5 px-3">
        <div className="label px-2 pb-2">Coming soon</div>
        {[
          { label: "Team access", icon: Users, when: "Next" },
          { label: "Integrations", icon: Cable, when: "Later" },
        ].map((n) => (
          <div key={n.label} className="flex h-10 cursor-default items-center gap-3 rounded-xl px-3 text-[14px] text-dim">
            <n.icon className="h-4 w-4" strokeWidth={1.7} />
            <span className="flex-1">{n.label}</span>
            <Lock className="h-3 w-3" />
          </div>
        ))}
      </nav>

      <div className="mt-auto p-4">
        <Link
          href="/app/settings"
          className="block rounded-2xl border border-line bg-ink/50 p-3.5 transition-colors hover:border-line-strong"
        >
          <div className="label mb-2">Engine</div>
          <div className="flex items-center gap-2 text-[13px]">
            <span className={cx("h-1.5 w-1.5 rounded-full", ai ? "bg-lime animate-pulse-soft" : "bg-amber")} />
            <span className={ai ? "text-fg" : "text-amber"}>{ai ? "Claude connected" : "Extractive mode"}</span>
          </div>
          {!ai && <div className="mt-1 text-[11.5px] text-muted">Add an API key for synthesis</div>}
        </Link>
      </div>
    </div>
  );

  return (
    <>
      <div className="sticky top-0 z-30 flex items-center justify-between border-b border-line bg-base/85 px-4 py-3 backdrop-blur lg:hidden">
        <Logo size="sm" />
        <button onClick={() => setOpen(true)} className="text-soft" aria-label="Open menu">
          <Menu className="h-5 w-5" />
        </button>
      </div>
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-[256px] border-r border-line bg-ink/60 backdrop-blur lg:block">
        {body}
      </aside>
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-[272px] border-r border-line bg-ink">{body}</aside>
        </div>
      )}
    </>
  );
}
