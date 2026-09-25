import { ImageResponse } from "next/og";

// The Cairn mark: lime tile with a dark inner square, same as the <Logo /> component.
export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
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
          borderRadius: 8,
        }}
      >
        <div style={{ width: 10, height: 10, borderRadius: 3, background: "#11160a" }} />
      </div>
    ),
    size,
  );
}
