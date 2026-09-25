import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata } from "next";
import { JetBrains_Mono, Manrope } from "next/font/google";
import { clerkAppearance } from "@/lib/clerk-theme";
import "./globals.css";

const display = Manrope({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const code = JetBrains_Mono({
  variable: "--font-code",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

// Absolute base for social-image URLs: production domain on Vercel, localhost in dev.
const site = process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  : "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(site),
  title: { default: "Cairn — Private research & decision intelligence", template: "%s · Cairn" },
  description:
    "Turn your company's documents, spreadsheets and meeting notes into cited answers, comparisons and decision briefs.",
  openGraph: { siteName: "Cairn", type: "website" },
  twitter: { card: "summary_large_image" },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${display.variable} ${code.variable} h-full antialiased`}>
      <body className="min-h-full">
        <ClerkProvider appearance={clerkAppearance} afterSignOutUrl="/">
          {children}
        </ClerkProvider>
      </body>
    </html>
  );
}
