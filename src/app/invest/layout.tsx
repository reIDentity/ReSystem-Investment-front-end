import type { Metadata } from "next";
import { Space_Grotesk, JetBrains_Mono } from "next/font/google";
import { DemoProvider } from "@/components/invest/DemoProvider";
import "./investor.css";

const display = Space_Grotesk({ variable: "--font-invest-display", subsets: ["latin"], weight: ["500", "600", "700"] });
const mono = JetBrains_Mono({ variable: "--font-invest-mono", subsets: ["latin"], weight: ["400", "500", "700"] });

export const metadata: Metadata = { title: "Investor app — reSystem Investment", description: "Explore the reSystem investor dashboard demo." };

export default function InvestorLayout({ children }: { children: React.ReactNode }) {
  return <div className={`${display.variable} ${mono.variable}`}><DemoProvider>{children}</DemoProvider></div>;
}
