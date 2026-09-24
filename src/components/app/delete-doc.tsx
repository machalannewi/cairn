"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui";

export function DeleteDoc({ id }: { id: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  return (
    <Button
      variant="ghost"
      disabled={busy}
      className="hover:!border-rose/50 hover:!text-rose"
      title="Remove from library"
      onClick={async () => {
        if (!confirm("Remove this document and its passages from the library? Past research keeps its quoted passages.")) return;
        setBusy(true);
        await fetch(`/api/documents/${id}`, { method: "DELETE" });
        router.push("/app/library");
        router.refresh();
      }}
    >
      {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
    </Button>
  );
}
