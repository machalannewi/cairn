import { ImageResponse } from "next/og";

// iOS rounds the corners itself, so this is a full-bleed square.
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#d7f25c",
        }}
      >
        <div style={{ width: 58, height: 58, borderRadius: 16, background: "#11160a" }} />
      </div>
    ),
    size,
  );
}
