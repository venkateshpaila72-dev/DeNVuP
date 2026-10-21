import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Inter, Space_Grotesk } from "next/font/google";
import SmoothScroll from "../components/SmoothScroll";
import GlowCursor from "../components/GlowCursor";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const space = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space",
  display: "swap",
});

export const metadata: Metadata = {
  title: "DENVUP — Creative Digital Agency",
  description:
    "DENVUP designs and develops digital experiences that help brands stand out, connect with people, and grow.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${space.variable}`}>
      <body>
        <SmoothScroll />
        <GlowCursor />
        {children}
      </body>
    </html>
  );
}