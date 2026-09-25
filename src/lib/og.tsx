import type { ReactNode } from "react";

/** Shared layout for 1200×630 social preview images (next/og — flexbox only). */
export const OG_SIZE = { width: 1200, height: 630 };

const C = {
  base: "#0a0e0b",
  line: "rgba(255,255,255,0.05)",
  fg: "#e9eee5",
  muted: "#858e84",
  lime: "#d7f25c",
  ink: "#11160a",
};

/** Manrope for headlines if Google Fonts is reachable; falls back to the built-in font otherwise. */
export async function ogFonts() {
  try {
    const css = await fetch("https://fonts.googleapis.com/css2?family=Manrope:wght@700", {
      // An old UA makes Google serve TTF, which next/og can read (it can't read woff2).
      headers: { "User-Agent": "Mozilla/4.0" },
    }).then((r) => r.text());
    const url = /src: url\((.+?)\)/.exec(css)?.[1];
    if (!url) return [];
    const data = await fetch(url).then((r) => r.arrayBuffer());
    return [{ name: "Manrope", data, weight: 700 as const, style: "normal" as const }];
  } catch {
    return [];
  }
}

export function OgFrame({ eyebrow, children, footer }: { eyebrow: string; children: ReactNode; footer: string }) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: 72,
        background: C.base,
        backgroundImage: `linear-gradient(${C.line} 1px, transparent 1px), linear-gradient(90deg, ${C.line} 1px, transparent 1px), radial-gradient(60% 60% at 80% 10%, rgba(215,242,92,0.12), transparent 70%)`,
        backgroundSize: "64px 64px, 64px 64px, 100% 100%",
        color: C.fg,
        fontFamily: "Manrope",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: 14,
              background: C.lime,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div style={{ width: 17, height: 17, borderRadius: 5, background: C.ink }} />
          </div>
          <div style={{ fontSize: 26, letterSpacing: 9, fontWeight: 700 }}>CAIRN</div>
        </div>
        <div style={{ fontSize: 20, letterSpacing: 5, color: C.lime, textTransform: "uppercase" }}>{eyebrow}</div>
      </div>
      {children}
      <div style={{ display: "flex", fontSize: 19, letterSpacing: 5, color: C.muted, textTransform: "uppercase" }}>
        {footer}
      </div>
    </div>
  );
}

export const OG_COLORS = C;
