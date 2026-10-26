import type { Metadata } from "next";
import type { CSSProperties, ReactNode } from "react";
import "@fontsource-variable/inter";
import "@fontsource-variable/space-grotesk";
import SmoothScroll from "../components/SmoothScroll";
import GlowCursor from "../components/GlowCursor";
import "./globals.css";

// Fonts are installed locally (npm packages), so the site works without reaching Google Fonts.
// The CSS variables below keep the existing var(--font-inter) / var(--font-space) rules working.
const fontVars = {
  "--font-inter": "'Inter Variable'",
  "--font-space": "'Space Grotesk Variable'",
} as CSSProperties;

export const metadata: Metadata = {
  title: "DENVUP — Creative Digital Agency",
  description:
    "DENVUP designs and develops digital experiences that help brands stand out, connect with people, and grow.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" style={fontVars}>
      <body>
        <SmoothScroll />
        <GlowCursor />
        {children}
      </body>
    </html>
  );
}