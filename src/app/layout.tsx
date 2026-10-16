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
    "Buy shares in reSystem products like Fractionaire, reID and INFRA reAED. Every dollar a product earns goes to its shareholders, in proportion to the shares they hold.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" data-scroll-behavior="smooth" className={`${plex.variable} ${jakarta.variable} ${montserrat.variable}`}>
      <body>
        <noscript>
          <style>{`[data-reveal]{opacity:1!important;transform:none!important}`}</style>
        </noscript>
        {children}
      </body>
    </html>
  );
}
