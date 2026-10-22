import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import "./design.css";
import "./fonts/fallbacks.css";

const plex = localFont({
  src: [
    { path: "./fonts/IBM-Plex-Sans-latin.woff2", weight: "400", style: "normal" },
    { path: "./fonts/IBM-Plex-Sans-latin.woff2", weight: "500", style: "normal" },
    { path: "./fonts/IBM-Plex-Sans-latin.woff2", weight: "600", style: "normal" },
    { path: "./fonts/IBM-Plex-Sans-latin.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-plex",
  display: "swap",
  preload: true,
  adjustFontFallback: false,
  fallback: ["IBM Plex Sans Fallback"],
  declarations: [{ prop: "font-stretch", value: "100%" }],
});

const jakarta = localFont({
  src: [
    { path: "./fonts/Plus-Jakarta-Sans-latin.woff2", weight: "400", style: "normal" },
    { path: "./fonts/Plus-Jakarta-Sans-latin.woff2", weight: "500", style: "normal" },
    { path: "./fonts/Plus-Jakarta-Sans-latin.woff2", weight: "600", style: "normal" },
    { path: "./fonts/Plus-Jakarta-Sans-latin.woff2", weight: "700", style: "normal" },
    { path: "./fonts/Plus-Jakarta-Sans-latin.woff2", weight: "800", style: "normal" },
  ],
  variable: "--font-jakarta",
  display: "swap",
  preload: true,
  adjustFontFallback: false,
  fallback: ["Plus Jakarta Sans Fallback"],
});

const montserrat = localFont({
  src: [{ path: "./fonts/Montserrat-latin.woff2", weight: "700", style: "normal" }],
  variable: "--font-montserrat",
  display: "swap",
  preload: true,
  adjustFontFallback: false,
  fallback: ["Montserrat Fallback"],
});

export const metadata: Metadata = {
  title: "reSystem Investment — Own a share of the products that earn real revenue",
  description:
    "Buy fractions in published reSystem projects on INFRA. Review current prices, confirmed revenue funding and allocated holder rewards.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" data-scroll-behavior="smooth" className={`${plex.variable} ${jakarta.variable} ${montserrat.variable}`}>
      <body>
        <noscript>
          <style>{`[data-reveal],[data-cascade]{opacity:1!important;transform:none!important;clip-path:none!important}`}</style>
        </noscript>
        {children}
      </body>
    </html>
  );
}
