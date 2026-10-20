import Image from "next/image";
import { Container } from "./Container";
import { Reveal } from "./Reveal";

export function CtaBanner() {
  return (
    <section className="cta-section mt-4">
      <Container>
        <Reveal variant="wipe" className="[--wipe-r:12px]">
        <div className="cta-panel grid gap-6 rounded-[20px] border border-line bg-[#f7f7f8] p-4 sm:p-5 lg:grid-cols-[1fr_1.15fr]">
          <div className="cta-copy flex flex-col justify-between gap-10 p-2 sm:p-4">
            <div>
              <h2 className="font-display text-[34px] leading-[1.1] font-extrabold text-ink">
                Start with $2,000.
                <br />
                Earn from day one.
              </h2>
              <p className="mt-6 max-w-[330px] text-[22px] leading-[1.25] text-[#8a8a8a]">
                Sign in with reID, deposit reAED or USDT, and pick the products you believe in.
              </p>
            </div>
            <a
              href="/invest"
              data-magnetic
              className="cta-invest btn btn-shine w-fit rounded-full bg-lime px-5 py-3 font-display text-[13px] font-bold text-ink hover:shadow-[0_10px_24px_-10px_rgba(0,145,255,0.7)]"
            >
              Invest with reID
            </a>
          </div>
          <div className="cta-art relative min-h-[300px] overflow-hidden rounded-2xl">
            <Image
              src="/images/figma/22-10486-c1d4c.png"
              alt=""
              fill
              sizes="(max-width: 1024px) 100vw, 55vw"
              className="object-fill"
            />
            <span className="cta-glass"><Image src="/images/figma/22-10486-de3e7.svg" alt="" width={165.523} height={165.523} /></span>
          </div>
        </div>
        </Reveal>
      </Container>
    </section>
  );
}
