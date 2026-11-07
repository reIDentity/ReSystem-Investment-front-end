import { LandingData } from "@/components/LandingData";
import { Calculator } from "@/components/Calculator";
import { Compare } from "@/components/Compare";
import { CtaBanner } from "@/components/CtaBanner";
import { Ecosystem } from "@/components/Ecosystem";
import { Faq } from "@/components/Faq";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { HowItWorks } from "@/components/HowItWorks";
import { MoneyFlow } from "@/components/MoneyFlow";
import { MotionEffects } from "@/components/MotionEffects";
import { Products } from "@/components/Products";
import { Stats } from "@/components/Stats";
import { WhyInvest } from "@/components/WhyInvest";
import { Suspense, type ReactNode } from "react";
import { getInitialLandingCatalogue } from "@/lib/platform/landing-server";
import { connection } from "next/server";

async function PublishedLanding({ children }: { children: ReactNode }) {
  await connection();
  let initialCatalogue;
  try { initialCatalogue = await getInitialLandingCatalogue(); }
  catch { /* The existing public loading/retry state remains usable on an outage. */ }
  return <LandingData initialCatalogue={initialCatalogue}>{children}</LandingData>;
}

export default function Home() {
  const content = <main>
        <Hero />
        <Ecosystem />
        <Stats />
        <Products />
        <WhyInvest />
        <MoneyFlow />
        <Calculator />
        <Compare />
        <HowItWorks />
        <Faq />
        <CtaBanner />
      </main>;
  return (
    <>
      <Header />
      <Suspense fallback={<LandingData>{content}</LandingData>}><PublishedLanding>{content}</PublishedLanding></Suspense>
      <Footer />
      <MotionEffects />
    </>
  );
}
