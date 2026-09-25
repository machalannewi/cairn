import { OrganizationProfile } from "@clerk/nextjs";
import { Check, Minus, ShieldCheck, Users } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { Panel, Tag } from "@/components/ui";
import { requireWorkspace } from "@/lib/session";

export const metadata = { title: "Team" };

const ABILITIES: [string, boolean, boolean][] = [
  ["Upload documents & search", true, true],
  ["Run answers, comparisons & briefs", true, true],
  ["Save, annotate & share research", true, true],
  ["Delete or unshare their own research", true, true],
  ["Delete or unshare anyone's research", false, true],
  ["Remove documents & clear samples", false, true],
  ["Invite, remove & change member roles", false, true],
];

export default async function TeamPage() {
  const { db, isAdmin, name } = await requireWorkspace();

  // Contribution counts from the workspace's own records.
  const people = new Map<string, { name: string; docs: number; runs: number; shared: number }>();
  const bump = (by: { id: string; name: string } | undefined, key: "docs" | "runs" | "shared") => {
    if (!by) return;
    const p = people.get(by.id) ?? { name: by.name, docs: 0, runs: 0, shared: 0 };
    p[key]++;
    people.set(by.id, p);
  };
  db.docs.forEach((d) => bump(d.uploadedBy, "docs"));
  db.research.forEach((r) => {
    bump(r.createdBy, "runs");
    if (r.shareToken) bump(r.createdBy, "shared");
  });
  const activity = [...people.values()].sort((a, b) => b.runs + b.docs - (a.runs + a.docs));

  return (
    <>
      <PageHeader
        eyebrow={`Team / ${name}`}
        title="Team"
        description={
          isAdmin
            ? "Invite teammates, set roles and manage this workspace. Everyone here shares one private library and research trail."
            : "Everyone in this workspace shares one private library and research trail. Ask an admin to invite others or change roles."
        }
      />

      <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
        <div className="min-w-0 [&_.cl-rootBox]:w-full [&_.cl-cardBox]:w-full [&_.cl-cardBox]:max-w-none">
          <OrganizationProfile routing="hash" />
        </div>

        <aside className="space-y-6">
          <Panel title="Roles" icon={<ShieldCheck className="h-3.5 w-3.5" />} right={<Tag tone="lime">{isAdmin ? "You: admin" : "You: member"}</Tag>}>
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-line">
                  <th className="px-5 py-2.5 text-left font-normal" />
                  <th className="label w-16 py-2.5 font-normal">Member</th>
                  <th className="label w-16 py-2.5 pr-4 font-normal">Admin</th>
                </tr>
              </thead>
              <tbody>
                {ABILITIES.map(([label, member, admin]) => (
                  <tr key={label} className="border-b border-line last:border-0">
                    <td className="px-5 py-2.5 leading-snug text-soft">{label}</td>
                    {[member, admin].map((ok, i) => (
                      <td key={i} className="py-2.5 text-center">
                        {ok ? <Check className="mx-auto h-3.5 w-3.5 text-lime" /> : <Minus className="mx-auto h-3.5 w-3.5 text-dim" />}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </Panel>

          <Panel title="Activity" icon={<Users className="h-3.5 w-3.5" />}>
            {activity.length ? (
              <ul className="divide-y divide-line">
                {activity.map((p) => (
                  <li key={p.name} className="flex items-center gap-3 px-5 py-3">
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-line-strong bg-ink font-mono text-[11px] text-lime">
                      {p.name.slice(0, 1).toUpperCase()}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-[14px]">{p.name}</span>
                    <span className="font-mono text-[10.5px] text-dim">
                      {p.docs} docs · {p.runs} runs{p.shared ? ` · ${p.shared} shared` : ""}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="px-5 py-4 text-[13px] text-muted">No uploads or research yet. Activity appears here as the team works.</p>
            )}
          </Panel>
        </aside>
      </div>
    </>
  );
}
