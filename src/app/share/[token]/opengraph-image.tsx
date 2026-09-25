import { ImageResponse } from "next/og";
import { OG_COLORS as C, OG_SIZE, OgFrame, ogFonts } from "@/lib/og";
import { findShared } from "@/lib/store";

export const alt = "Shared research report on Cairn";
export const size = OG_SIZE;
export const contentType = "image/png";

const MODE = { ask: "Cited answer", compare: "Comparison", brief: "Decision brief" } as const;

/** Per-report preview so a pasted share link shows its title, not a generic card. */
export default async function SharedReportImage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const hit = /^[\w-]{12,64}$/.test(token) ? await findShared(token).catch(() => null) : null;
  const title = hit?.record.title ?? "Report not found";
  const docs = hit ? new Set(hit.record.sources.map((s) => s.docId)).size : 0;

  return new ImageResponse(
    (
      <OgFrame
        eyebrow={hit ? MODE[hit.record.mode] : "Shared report"}
        footer={hit ? `Shared by ${hit.workspace} · read-only` : "Cairn"}
      >
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              display: "flex",
              fontSize: title.length > 60 ? 64 : 80,
              fontWeight: 700,
              letterSpacing: -3,
              lineHeight: 1.05,
              maxWidth: 1050,
            }}
          >
            {title}
          </div>
          {hit && (
            <div style={{ display: "flex", gap: 16, marginTop: 36 }}>
              {[`${hit.record.sources.length} cited sources`, `${docs} documents`].map((t) => (
                <div
                  key={t}
                  style={{
                    display: "flex",
                    fontSize: 24,
                    color: C.lime,
                    border: "2px solid rgba(215,242,92,0.35)",
                    background: "rgba(215,242,92,0.07)",
                    borderRadius: 12,
                    padding: "10px 20px",
                  }}
                >
                  {t}
                </div>
              ))}
            </div>
          )}
        </div>
      </OgFrame>
    ),
    { ...size, fonts: await ogFonts() },
  );
}
