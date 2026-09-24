import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { FileSpreadsheet, FileText, FileType2, NotebookPen } from "lucide-react";
import type { DocKind } from "@/lib/types";

export function cx(...c: (string | false | null | undefined)[]) {
  return c.filter(Boolean).join(" ");
}

export function Logo({ size = "md" }: { size?: "sm" | "md" }) {
  const box = size === "sm" ? "h-6 w-6 rounded-[7px]" : "h-8 w-8 rounded-[9px]";
  return (
    <span className="flex items-center gap-2.5">
      <span className={cx(box, "grid place-items-center bg-lime shadow-[0_0_24px_-6px_rgb(215_242_92/0.6)]")}>
        <span className="h-2.5 w-2.5 rounded-[3px] bg-lime-ink" />
      </span>
      <span className="font-mono text-[13px] font-semibold tracking-[0.28em] text-fg">CAIRN</span>
    </span>
  );
}

export function Label({ children, className, accent }: { children: ReactNode; className?: string; accent?: boolean }) {
  return <div className={cx("label", accent && "!text-lime", className)}>{children}</div>;
}

export function Dot({ tone = "lime", pulse }: { tone?: "lime" | "amber" | "muted" | "rose"; pulse?: boolean }) {
  const c = { lime: "bg-lime", amber: "bg-amber", muted: "bg-dim", rose: "bg-rose" }[tone];
  return <span className={cx("inline-block h-1.5 w-1.5 rounded-full", c, pulse && "animate-pulse-soft")} />;
}

type BtnVariant = "primary" | "ghost" | "light" | "subtle";
const btn: Record<BtnVariant, string> = {
  primary:
    "bg-lime text-lime-ink hover:bg-[#e2fa70] shadow-[0_8px_30px_-12px_rgb(215_242_92/0.55)] font-semibold",
  light: "bg-fg text-ink hover:bg-white font-semibold",
  ghost: "border border-line-strong bg-ink/40 text-fg hover:border-muted hover:bg-panel-2 font-medium",
  subtle: "text-soft hover:text-fg hover:bg-panel-2 font-medium",
};

export function buttonClass(variant: BtnVariant = "primary", size: "sm" | "md" | "lg" = "md") {
  const s = { sm: "h-8 px-3.5 text-[13px]", md: "h-10 px-5 text-sm", lg: "h-12 px-6 text-[15px]" }[size];
  return cx(
    "inline-flex items-center justify-center gap-2 rounded-full transition-all duration-150 disabled:opacity-40 disabled:pointer-events-none whitespace-nowrap",
    s,
    btn[variant],
  );
}

export function Button({
  variant = "primary",
  size = "md",
  className,
  ...props
}: ComponentProps<"button"> & { variant?: BtnVariant; size?: "sm" | "md" | "lg" }) {
  return <button className={cx(buttonClass(variant, size), className)} {...props} />;
}

export function LinkButton({
  variant = "primary",
  size = "md",
  className,
  ...props
}: ComponentProps<typeof Link> & { variant?: BtnVariant; size?: "sm" | "md" | "lg" }) {
  return <Link className={cx(buttonClass(variant, size), className)} {...props} />;
}

export function Tag({
  children,
  tone = "muted",
  className,
}: {
  children: ReactNode;
  tone?: "muted" | "lime" | "amber" | "rose" | "sky";
  className?: string;
}) {
  const t = {
    muted: "text-muted border-line-strong",
    lime: "text-lime border-lime/35 bg-lime/[0.06]",
    amber: "text-amber border-amber/35 bg-amber/[0.06]",
    rose: "text-rose border-rose/35 bg-rose/[0.06]",
    sky: "text-sky border-sky/35 bg-sky/[0.06]",
  }[tone];
  return (
    <span
      className={cx(
        "inline-flex h-[22px] items-center gap-1.5 rounded-md border px-2 font-mono text-[9.5px] font-medium uppercase tracking-[0.16em]",
        t,
        className,
      )}
    >
      {children}
    </span>
  );
}

export function Panel({
  children,
  className,
  title,
  icon,
  right,
}: {
  children: ReactNode;
  className?: string;
  title?: string;
  icon?: ReactNode;
  right?: ReactNode;
}) {
  return (
    <section className={cx("panel", className)}>
      {title && (
        <header className="flex items-center justify-between gap-3 border-b border-line px-5 py-3.5">
          <div className="label flex items-center gap-2">
            {icon && <span className="text-lime">{icon}</span>}
            {title}
          </div>
          {right}
        </header>
      )}
      {children}
    </section>
  );
}

export function DocIcon({ kind, className }: { kind: DocKind; className?: string }) {
  const I = kind === "sheet" || kind === "csv" ? FileSpreadsheet : kind === "pdf" ? FileType2 : kind === "docx" ? FileText : NotebookPen;
  return <I className={cx("h-4 w-4", className)} strokeWidth={1.6} />;
}

export function kindLabel(kind: DocKind) {
  return { pdf: "PDF", docx: "DOCX", sheet: "XLSX", csv: "CSV", markdown: "MD", text: "TXT" }[kind];
}

export function formatBytes(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

export function timeAgo(iso: string) {
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 86400 * 7) return `${Math.floor(s / 86400)}d ago`;
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

export function clock(iso: string) {
  return new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

export const MODE_META = {
  ask: { label: "Answer", tone: "lime" as const },
  compare: { label: "Comparison", tone: "sky" as const },
  brief: { label: "Decision brief", tone: "amber" as const },
};
