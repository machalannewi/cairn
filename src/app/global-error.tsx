"use client";

import { JetBrains_Mono, Manrope } from "next/font/google";
import { ErrorView } from "@/components/error-view";
import { Logo } from "@/components/ui";
import "./globals.css";

// Replaces the root layout when it crashes, so it brings its own document, styles and fonts.
const display = Manrope({ variable: "--font-display", subsets: ["latin"], weight: ["400", "700"] });
const code = JetBrains_Mono({ variable: "--font-code", subsets: ["latin"], weight: ["400", "500"] });

export default function GlobalError(props: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <html lang="en" className={`${display.variable} ${code.variable} antialiased`}>
      <body>
        <title>Something went wrong · Cairn</title>
        <div className="grid min-h-screen place-items-center bg-grid px-6">
          <div>
            <div className="mb-10 flex justify-center">
              <Logo />
            </div>
            <ErrorView {...props} />
          </div>
        </div>
      </body>
    </html>
  );
}
