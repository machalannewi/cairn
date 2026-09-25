"use client";

import { ErrorView } from "@/components/error-view";

/** Errors inside the workspace render in place, so the sidebar stays usable. */
export default function AppError(props: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <div className="panel grid min-h-[60vh] place-items-center px-6 py-16">
      <ErrorView {...props} home="/app" homeLabel="Back to overview" />
    </div>
  );
}
