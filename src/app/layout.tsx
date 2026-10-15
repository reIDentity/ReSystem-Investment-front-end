import type { Metadata } from "next";
import { IBM_Plex_Sans, Plus_Jakarta_Sans, Montserrat } from "next/font/google";
import "./globals.css";
import "./design.css";

const plex = IBM_Plex_Sans({
  variable: "--font-plex",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: ["700"],
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
