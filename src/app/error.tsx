"use client";

import { ErrorView } from "@/components/error-view";
import { Logo } from "@/components/ui";

export default function RootError(props: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <div className="grid min-h-screen place-items-center bg-grid px-6">
      <div>
        <div className="mb-10 flex justify-center">
          <Logo />
        </div>
        <ErrorView {...props} />
      </div>
    </div>
  );
}
