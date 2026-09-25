import { ImageResponse } from "next/og";
import { OG_COLORS as C, OG_SIZE, OgFrame, ogFonts } from "@/lib/og";

export const alt = "Cairn — turn company documents into cited answers and decision briefs";
export const size = OG_SIZE;
export const contentType = "image/png";

export default async function OpenGraphImage() {
  return new ImageResponse(
    (
      <OgFrame eyebrow="Private research engine" footer="Real sources / Visible reasoning / Durable decisions">
        <div style={{ display: "flex", flexDirection: "column" }}>
          {/* Two lines; next/og mis-measures negative letter-spacing, so keep it modest. */}
          <div style={{ display: "flex", flexDirection: "column", fontSize: 92, fontWeight: 700, letterSpacing: -2, lineHeight: 1.08 }}>
            <div style={{ display: "flex" }}>Upload. Ask.</div>
            <div style={{ display: "flex", alignItems: "center" }}>
              <div style={{ display: "flex", background: C.lime, color: C.ink, padding: "0 16px", marginLeft: -16, marginRight: 22 }}>
                Cite.
              </div>
              Decide.
            </div>
          </div>
          <div style={{ marginTop: 30, fontSize: 32, color: C.muted, maxWidth: 900, lineHeight: 1.4 }}>
            Cited answers, comparisons and decision briefs from your company&apos;s documents.
          </div>
        </div>
      </OgFrame>
    ),
    { ...size, fonts: await ogFonts() },
  );
}
