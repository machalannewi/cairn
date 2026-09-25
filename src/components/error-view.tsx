"use client";

import Link from "next/link";
import { useEffect } from "react";
import { RotateCcw } from "lucide-react";
import { Button, buttonClass, Label } from "@/components/ui";

/**
 * Shared body for error boundaries. Production shows only the digest (a reference
 * that matches the server log line) — never the raw message, which may leak internals.
 */
export function ErrorView({
  error,
  retry,
  home = "/",
  homeLabel = "Back to home",
}: {
  error: Error & { digest?: string };
  retry: () => void;
  home?: string;
  homeLabel?: string;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="text-center">
      <Label accent>Error / 500</Label>
      <h1 className="mt-3 text-4xl font-bold tracking-tight">The trail went cold.</h1>
      <p className="mx-auto mt-3 max-w-md text-muted">
        Something broke while loading this page. It&apos;s usually temporary — try again, and if it keeps happening, share
        the reference below.
      </p>
      {process.env.NODE_ENV === "development" && error.message && (
        <pre className="mx-auto mt-5 max-w-xl overflow-x-auto rounded-xl border border-rose/30 bg-rose/[0.05] p-4 text-left font-mono text-[12px] text-rose">
          {error.message}
        </pre>
      )}
      {error.digest && (
        <div className="mt-5 font-mono text-[11px] tracking-wide text-dim">Reference: {error.digest}</div>
      )}
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button onClick={() => retry()}>
          <RotateCcw className="h-4 w-4" /> Try again
        </Button>
        <Link href={home} className={buttonClass("ghost")}>
          {homeLabel}
        </Link>
      </div>
    </div>
  );
}
