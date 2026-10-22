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

export default function Home() {
  return (
    <>
      <Header />
      <LandingData>
      <main>
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
      </main>
      </LandingData>
      <Footer />
      <MotionEffects />
    </>
  );
}
