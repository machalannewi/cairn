"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { OrganizationSwitcher, UserButton } from "@clerk/nextjs";
import { useState } from "react";
import { BookMarked, Cable, FolderOpen, LayoutGrid, Lock, Menu, Plus, Settings2, Users, X } from "lucide-react";
import { cx, LinkButton, Logo } from "@/components/ui";

const NAV = [
  { href: "/app", label: "Overview", icon: LayoutGrid, exact: true },
  { href: "/app/library", label: "Library", icon: FolderOpen },
  { href: "/app/research", label: "Research", icon: BookMarked },
  { href: "/app/team", label: "Team", icon: Users },
  { href: "/app/settings", label: "Settings", icon: Settings2 },
];

export function Sidebar({
  ai,
  isAdmin,
  counts,
}: {
  ai: boolean;
  isAdmin: boolean;
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

      <div className="mx-4 mt-7 rounded-2xl border border-line bg-ink/50 p-1">
        <OrganizationSwitcher
          hidePersonal
          afterSelectOrganizationUrl="/app"
          afterCreateOrganizationUrl="/app"
          afterLeaveOrganizationUrl="/app"
          organizationProfileUrl="/app/team"
          organizationProfileMode="navigation"
        />
        <div className="px-3 pb-2 font-mono text-[9.5px] uppercase tracking-[0.18em] text-dim">
          {isAdmin ? "Admin" : "Member"}
        </div>
      </div>

      <div className="scroll-thin min-h-0 flex-1 overflow-y-auto pb-4">
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
        {[{ label: "Integrations", icon: Cable }].map((n) => (
          <div key={n.label} className="flex h-10 cursor-default items-center gap-3 rounded-xl px-3 text-[14px] text-dim">
            <n.icon className="h-4 w-4" strokeWidth={1.7} />
            <span className="flex-1">{n.label}</span>
            <Lock className="h-3 w-3" />
          </div>
        ))}
      </nav>
      </div>

      {/* Pinned footer: always visible, however short the window */}
      <div className="shrink-0 space-y-2 border-t border-line p-3">
        <Link
          href="/app/settings"
          onClick={() => setOpen(false)}
          className="flex items-center gap-2 rounded-xl px-2.5 py-2 text-[12.5px] transition-colors hover:bg-panel-2"
          title={ai ? "Claude connected" : "Add an API key in Settings for synthesis"}
        >
          <span className={cx("h-1.5 w-1.5 shrink-0 rounded-full", ai ? "bg-lime animate-pulse-soft" : "bg-amber")} />
          <span className="label !text-[9.5px]">Engine</span>
          <span className={cx("ml-auto truncate", ai ? "text-soft" : "text-amber")}>{ai ? "Claude" : "Extractive"}</span>
        </Link>
        <div className="flex min-w-0 items-center gap-2 overflow-hidden rounded-xl border border-line bg-ink/50 px-2.5 py-2 [&_.cl-userButtonBox]:min-w-0 [&_.cl-userButtonOuterIdentifier]:truncate [&_.cl-userButtonTrigger]:min-w-0 [&_.cl-userButtonTrigger]:max-w-full">
          <UserButton showName />
        </div>
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
