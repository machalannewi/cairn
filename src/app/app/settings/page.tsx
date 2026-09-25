import Link from "next/link";
import { ArrowUpRight, Cable, Cpu, Database, Lock, ShieldCheck, Users } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { buttonClass, Label, Panel, Tag } from "@/components/ui";
import { aiEnabled, MODEL } from "@/lib/engine";
import { requireWorkspace } from "@/lib/session";

export const metadata = { title: "Settings" };

const INTEGRATIONS = ["Google Drive", "Notion", "SharePoint", "Slack", "Confluence", "Dropbox"];

export default async function Settings() {
  const { db, name } = await requireWorkspace();
  const ai = aiEnabled();
  return (
    <>
      <PageHeader eyebrow="Settings / Workspace" title="Settings" description="Engine, data handling, team access and integrations." />

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Research engine" icon={<Cpu className="h-3.5 w-3.5" />} right={<Tag tone={ai ? "lime" : "amber"}>{ai ? "Live" : "Extractive"}</Tag>}>
          <div className="space-y-4 p-5 text-[14px]">
            <Row k="Model" v={ai ? MODEL : "—"} />
            <Row k="Mode" v={ai ? "Synthesis with verified citations" : "Verbatim passage extraction"} />
            <Row k="Fallback" v={ai ? "Server-side refusal fallback on" : "—"} />
            {!ai && (
              <div className="rounded-xl border border-amber/30 bg-amber/[0.05] p-4 text-[13.5px] leading-relaxed text-soft">
                Add your Anthropic API key to <code className="font-mono text-lime">.env.local</code> and restart the server:
                <pre className="mt-3 overflow-x-auto rounded-lg border border-line bg-ink p-3 font-mono text-[12px] text-fg">ANTHROPIC_API_KEY=sk-ant-…</pre>
              </div>
            )}
          </div>
        </Panel>

        <Panel title="Data & privacy" icon={<ShieldCheck className="h-3.5 w-3.5" />}>
          <div className="space-y-4 p-5 text-[14px]">
            <Row k="Workspace" v={name} />
            <Row k="Focus" v={db.workspace.focus} />
            <Row k="Storage" v="Local disk · isolated per workspace" />
            <Row k="Sent to model" v="Only retrieved passages (≤ 18 per run)" />
            <Row k="Share links" v={`${db.research.filter((r) => r.shareToken).length} active · revocable`} />
          </div>
        </Panel>

        <Panel title="Team access" icon={<Users className="h-3.5 w-3.5" />} right={<Tag tone="lime">Live</Tag>}>
          <div className="p-5">
            <p className="text-[14px] leading-relaxed text-muted">
              Workspaces are private to their members. Admins invite teammates and set roles; members upload, research and
              share.
            </p>
            <Link href="/app/team" className={buttonClass("ghost", "sm") + " mt-5"}>
              Manage team <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </Panel>

        <Panel title="Integrations" icon={<Cable className="h-3.5 w-3.5" />} right={<Tag>Later</Tag>}>
          <div className="grid grid-cols-2 gap-2 p-5 sm:grid-cols-3">
            {INTEGRATIONS.map((i) => (
              <div key={i} className="flex items-center justify-between rounded-xl border border-line bg-ink/40 px-3.5 py-3 text-[13px] text-muted">
                {i} <Lock className="h-3 w-3 text-dim" />
              </div>
            ))}
          </div>
          <p className="px-5 pb-5 text-[13px] text-dim">Connectors will sync documents into the same index, so research can span every source.</p>
        </Panel>
      </div>

      <div className="mt-6 flex items-center gap-3 rounded-2xl border border-line bg-ink/40 px-5 py-4">
        <Database className="h-4 w-4 text-lime" />
        <Label className="!normal-case !tracking-normal !text-[13px] !font-sans text-muted">
          {db.docs.length} documents · {db.chunks.length} passages · {db.research.length} research runs
        </Label>
      </div>
    </>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-center justify-between gap-6 border-b border-line pb-3 last:border-0 last:pb-0">
      <span className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-muted">{k}</span>
      <span className="text-right text-soft">{v}</span>
    </div>
  );
}
