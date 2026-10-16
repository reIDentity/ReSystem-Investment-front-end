import type { Metadata } from "next";
import localFont from "next/font/local";
import "./investor.css";

const display = localFont({
  src: [
    { path: "../fonts/Space-Grotesk-latin.woff2", weight: "500", style: "normal" },
    { path: "../fonts/Space-Grotesk-latin.woff2", weight: "600", style: "normal" },
    { path: "../fonts/Space-Grotesk-latin.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-invest-display",
  display: "swap",
  preload: true,
  adjustFontFallback: false,
  fallback: ["Space Grotesk Fallback"],
});
const mono = localFont({
  src: [
    { path: "../fonts/JetBrains-Mono-latin.woff2", weight: "400", style: "normal" },
    { path: "../fonts/JetBrains-Mono-latin.woff2", weight: "500", style: "normal" },
    { path: "../fonts/JetBrains-Mono-latin.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-invest-mono",
  display: "swap",
  preload: true,
  adjustFontFallback: false,
  fallback: ["JetBrains Mono Fallback"],
});

export const metadata: Metadata = { title: "Investor app — reSystem Investment", description: "Connect with reID to access reSystem Investment." };

export default function InvestorLayout({ children }: { children: React.ReactNode }) {
  return <div className={`${display.variable} ${mono.variable}`}>{children}</div>;
}
