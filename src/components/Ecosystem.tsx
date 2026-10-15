/* The original SVG marks retain their intrinsic dimensions inside each Figma logo pill. */
/* eslint-disable @next/next/no-img-element */
import { Container } from "./Container";
import { Reveal } from "./Reveal";

const logos = [
  { name: "INFRA", width: 126.027 },
  { name: "INFRA reAED", width: 195.027 },
  { name: "reID", width: 115.161 },
  { name: "Fractionaire", width: 181.781 },
  { name: "reInvest", width: 159.468 },
  { name: "reMarketplace", width: 228.590 },
  { name: "Crypto Estate Tech", width: 248.641 },
  { name: "IDOS", width: 118.641 },
  { name: "21MINE", width: 159.752 },
  { name: "Desert Tech", width: 210.715 },
  { name: "reWallet", width: 161.421 },
];

function Mark({ asset }: { asset: string }) {
  return <img src={`/images/figma/20-9702-${asset}.svg`} alt="" />;
}

function LogoContent({ name }: { name: string }) {
  switch (name) {
    case "INFRA": return <><span className="ecosystem-infra"><Mark asset="6dd3e" /></span><span>INFRA</span></>;
    case "INFRA reAED": return <><span className="ecosystem-reaed"><Mark asset="2b460" /><span><Mark asset="3227d" /></span></span><span>INFRA reAED</span></>;
    case "reID": return <><Mark asset="962bf" /><span className="ecosystem-re"><Mark asset="75b33" /><span>ID</span></span></>;
    case "Fractionaire": return <><span className="ecosystem-fractionaire"><Mark asset="0037c" /></span><span>Fractionaire</span></>;
    case "reInvest": return <><Mark asset="57882" /><span className="ecosystem-re"><Mark asset="352ec" /><span>Invest</span></span></>;
    case "reMarketplace": return <><Mark asset="b1c06" /><span className="ecosystem-re"><Mark asset="89b06" /><span>Marketplace</span></span></>;
    case "Crypto Estate Tech": return <><span className="ecosystem-cet"><Mark asset="bed37" /></span><span>Crypto Estate Tech</span></>;
    case "IDOS": return <><span className="ecosystem-idos"><Mark asset="62792" /><Mark asset="041e3" /></span><span className="ecosystem-large">IDOS</span></>;
    case "21MINE": return <><Mark asset="bf234" /><span className="ecosystem-large">21MINE</span></>;
    case "Desert Tech": return <><Mark asset="43707" /><span><strong>DESERT</strong> <span className="font-normal">TECH</span></span></>;
    default: return <><Mark asset="ea0a7" /><span className="ecosystem-re"><Mark asset="68d03" /><span>Wallet</span></span></>;
  }
}

export function Ecosystem() {
  return (
    <section className="ecosystem-section mt-8">
      <Container><Reveal variant="fade"><p className="font-sans text-[24px] font-bold text-ink-soft">One reID. Every product in the ecosystem.</p></Reveal></Container>
      <div className="ecosystem-window">
        <div className="ecosystem-strip animate-marquee hover:[animation-play-state:paused]">
          {[false, true].map((duplicate) => logos.map((logo) => (
            <div key={`${logo.name}-${duplicate}`} className="ecosystem-pill" style={{ width: logo.width }} aria-hidden={duplicate || undefined} role="img" aria-label={duplicate ? undefined : logo.name}>
              <LogoContent name={logo.name} />
            </div>
          )))}
        </div>
      </div>
    </section>
  );
}
