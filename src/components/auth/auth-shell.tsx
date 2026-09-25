import Link from "next/link";
import type { ReactNode } from "react";
import { FileCheck2, Link2, Users } from "lucide-react";
import { Label, Logo } from "@/components/ui";

/** Split-screen frame for Clerk's sign-in / sign-up, in the landing page's style. */
export function AuthShell({ eyebrow, title, children }: { eyebrow: string; title: ReactNode; children: ReactNode }) {
  return (
    <div className="relative grid min-h-screen bg-grid lg:grid-cols-[1.05fr_1fr]">
      <div className="glow pointer-events-none absolute inset-0" />
      <section className="relative hidden flex-col justify-between border-r border-line p-12 lg:flex">
        <Link href="/">
          <Logo />
        </Link>
        <div>
          <Label accent className="mb-6">{eyebrow}</Label>
          <h1 className="max-w-md text-[52px] font-bold leading-[1] tracking-[-0.045em]">{title}</h1>
          <ul className="mt-10 space-y-4">
            {[
              [FileCheck2, "Answers cite the exact passage they came from"],
              [Users, "Private workspaces for each team, with roles"],
              [Link2, "Read-only share links you can revoke"],
            ].map(([Icon, text]) => {
              const I = Icon as typeof Users;
              return (
                <li key={text as string} className="flex items-center gap-3 text-[15px] text-soft">
                  <span className="grid h-8 w-8 place-items-center rounded-lg border border-line-strong bg-ink/60">
                    <I className="h-4 w-4 text-lime" strokeWidth={1.7} />
                  </span>
                  {text as string}
                </li>
              );
            })}
          </ul>
        </div>
        <div className="font-mono text-[10px] tracking-[0.22em] text-dim">REAL SOURCES / VISIBLE REASONING / DURABLE DECISIONS</div>
      </section>
      <section className="relative flex flex-col items-center justify-center gap-8 px-4 py-12">
        <Link href="/" className="lg:hidden">
          <Logo />
        </Link>
        {children}
      </section>
    </div>
  );
}
