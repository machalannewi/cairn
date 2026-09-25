import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep the dev-only "N" badge away from the sidebar's account menu.
  devIndicators: { position: "bottom-right" },
};

export default nextConfig;
