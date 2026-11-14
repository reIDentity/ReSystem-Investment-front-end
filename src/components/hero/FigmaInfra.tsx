"use client";
import { useHeroProject } from "./useHeroProject";
/* Exact static artwork layers from Figma; laid out inside the scaled hero canvas. */
/* eslint-disable @next/next/no-img-element */
export function FigmaInfra() {
  const hero = useHeroProject("infra-reaed");
  return (
    <div className="overflow-clip relative rounded-[23.239px] shadow-[0px_6.56px_31.651px_0px_rgba(0,0,0,0.25)] size-full" data-node-id="20:8761" data-name="M_INFRA_investment opportunity">
      <div aria-hidden className="absolute inset-0 pointer-events-none rounded-[23.239px]">
        <div className="absolute bg-white inset-0 rounded-[23.239px]" />
        <div className="absolute inset-0 overflow-hidden rounded-[23.239px]">
          <img alt="" className="absolute h-[123.76%] left-[-27.2%] max-w-none top-[-23.73%] w-[277.88%]" src="/images/figma/20-8761-c3cf7.png" />
        </div>
        <div className="absolute bg-[rgba(0,0,0,0.7)] inset-0 rounded-[23.239px]" />
      </div>
      <div className="-translate-x-1/2 -translate-y-1/2 absolute backdrop-blur-[6.499px] bg-[rgba(0,0,0,0.1)] h-[786.242px] left-[calc(50%+0.78px)] top-1/2 w-[441.005px]" data-node-id="20:8762" />
      <p className="-translate-x-1/2 [word-break:break-word] absolute font-sans font-semibold leading-[1.22] left-[calc(50%-11.3px)] text-[13.786px] text-center text-white top-[426.64px] tracking-[0.965px] whitespace-nowrap" data-node-id="20:8763" style={{ fontVariationSettings: '"wdth" 100' }}>{hero.status}</p>
      <div className="-translate-x-1/2 absolute h-0 left-[calc(50%-11.54px)] top-[445.07px] w-[177.812px]" data-node-id="20:8764">
        <div className="absolute inset-[-0.1px_0]">
          <img alt="" className="block max-w-none size-full" src="/images/figma/20-8761-a2029.svg" />
        </div>
      </div>
      <div className="absolute content-stretch flex flex-col gap-[5.12px] items-end left-[22.06px] top-[459.67px] w-[381.273px]" data-node-id="20:8765">
        <div className="content-stretch flex items-center justify-between relative shrink-0 w-full" data-node-id="20:8766">
          <div className="content-stretch flex gap-[7.878px] items-center relative shrink-0 w-[216.633px]" data-node-id="20:8767">
            <div className="bg-[#cfe0c4] border-[1.264px] border-[rgba(255,255,255,0.12)] border-solid relative rounded-[1.607px] shrink-0 size-[9.847px]" data-node-id="20:8768" />
            <p className="[word-break:break-word] font-sans font-semibold leading-[1.16] relative shrink-0 text-[11.816px] text-white tracking-[0.8271px] w-[202.834px]" data-node-id="20:8769" style={{ fontVariationSettings: '"wdth" 100' }}>{hero.rows[0].label}</p>
          </div>
          <p className="[word-break:break-word] font-sans font-semibold leading-[1.16] relative shrink-0 text-[11.816px] text-center text-white tracking-[0.8271px] whitespace-nowrap" data-node-id="20:8770" style={{ fontVariationSettings: '"wdth" 100' }}>{hero.rows[0].ratio}</p>
          <p className="[word-break:break-word] font-sans font-semibold leading-[0] relative shrink-0 text-[0px] text-right text-white tracking-[0.8271px] whitespace-nowrap" data-node-id="20:8771" style={{ fontVariationSettings: '"wdth" 100' }}>
            <span className="leading-[1.16] text-[11.816px]">{hero.rows[0].value}</span>
            <span className="font-sans font-medium leading-[1.16] text-[7.878px]" style={{ fontVariationSettings: '"wdth" 100' }}>{hero.rows[0].unit}</span>
          </p>
        </div>
        <div className="h-0 relative shrink-0 w-full" data-node-id="20:8772">
          <div className="absolute inset-[-0.04px_0]">
            <img alt="" className="block max-w-none size-full" src="/images/figma/20-8761-85776.svg" />
          </div>
        </div>
        <div className="content-stretch flex items-center justify-between relative shrink-0 w-full" data-node-id="20:8773">
          <div className="content-stretch flex gap-[7.878px] items-center relative shrink-0 w-[216.239px]" data-node-id="20:8774">
            <div className="bg-[#96ae65] border-[1.264px] border-[rgba(255,255,255,0.12)] border-solid relative rounded-[1.607px] shrink-0 size-[9.847px]" data-node-id="20:8775" />
            <p className="[word-break:break-word] font-sans font-semibold leading-[1.16] relative shrink-0 text-[11.816px] text-white tracking-[0.8271px] w-[223.429px]" data-node-id="20:8776" style={{ fontVariationSettings: '"wdth" 100' }}>{hero.rows[1].label}</p>
          </div>
          <p className="[word-break:break-word] font-sans font-semibold leading-[1.16] relative shrink-0 text-[11.816px] text-center text-white tracking-[0.8271px] whitespace-nowrap" data-node-id="20:8777" style={{ fontVariationSettings: '"wdth" 100' }}>{hero.rows[1].ratio}</p>
          <p className="[word-break:break-word] font-sans font-semibold leading-[0] relative shrink-0 text-[0px] text-right text-white tracking-[0.8271px] whitespace-nowrap" data-node-id="20:8778" style={{ fontVariationSettings: '"wdth" 100' }}>
            <span className="leading-[1.16] text-[11.816px]">{hero.rows[1].value}</span>
            <span className="font-sans font-medium leading-[1.16] text-[7.878px]" style={{ fontVariationSettings: '"wdth" 100' }}>{hero.rows[1].unit}</span>
          </p>
        </div>
        <div className="h-0 relative shrink-0 w-full" data-node-id="20:8779">
          <div className="absolute inset-[-0.04px_0]">
            <img alt="" className="block max-w-none size-full" src="/images/figma/20-8761-85776.svg" />
          </div>
        </div>
        <div className="content-stretch flex items-center justify-between relative shrink-0 w-full" data-node-id="20:8780">
          <div className="content-stretch flex gap-[7.878px] items-center relative shrink-0 w-[217.026px]" data-node-id="20:8781">
            <div className="bg-[#9cc820] border-[1.264px] border-[rgba(255,255,255,0.12)] border-solid relative rounded-[1.607px] shrink-0 size-[9.847px]" data-node-id="20:8782" />
            <p className="[word-break:break-word] font-sans font-semibold leading-[1.16] relative shrink-0 text-[11.816px] text-white tracking-[0.8271px] w-[171.65px]" data-node-id="20:8783" style={{ fontVariationSettings: '"wdth" 100' }}>{hero.rows[2].label}</p>
          </div>
          <p className="[word-break:break-word] font-sans font-semibold leading-[1.16] relative shrink-0 text-[11.816px] text-center text-white tracking-[0.8271px] whitespace-nowrap" data-node-id="20:8784" style={{ fontVariationSettings: '"wdth" 100' }}>{hero.rows[2].ratio}</p>
          <p className="[word-break:break-word] font-sans font-semibold leading-[0] relative shrink-0 text-[0px] text-right text-white tracking-[0.8271px] whitespace-nowrap" data-node-id="20:8785" style={{ fontVariationSettings: '"wdth" 100' }}>
            <span className="leading-[1.16] text-[11.816px]">{hero.rows[2].value}</span>
            <span className="font-sans font-medium leading-[1.16] text-[7.878px]" style={{ fontVariationSettings: '"wdth" 100' }}>{hero.rows[2].unit}</span>
          </p>
        </div>
        <div className="h-0 relative shrink-0 w-full" data-node-id="20:8786">
          <div className="absolute inset-[-0.04px_0]">
            <img alt="" className="block max-w-none size-full" src="/images/figma/20-8761-85776.svg" />
          </div>
        </div>
        <div className="content-stretch flex items-center justify-between relative shrink-0 w-full" data-node-id="20:8787">
          <div className="content-stretch flex gap-[7.878px] items-center relative shrink-0 w-[216.633px]" data-node-id="20:8788">
            <div className="bg-[#099385] border-[1.264px] border-[rgba(255,255,255,0.12)] border-solid relative rounded-[1.607px] shrink-0 size-[9.847px]" data-node-id="20:8789" />
            <p className="[word-break:break-word] font-sans font-semibold leading-[1.16] relative shrink-0 text-[11.816px] text-white tracking-[0.8271px] w-[103.217px]" data-node-id="20:8790" style={{ fontVariationSettings: '"wdth" 100' }}>{hero.rows[3].label}</p>
          </div>
          <p className="[word-break:break-word] font-sans font-semibold leading-[1.16] relative shrink-0 text-[11.816px] text-center text-white tracking-[0.8271px] whitespace-nowrap" data-node-id="20:8791" style={{ fontVariationSettings: '"wdth" 100' }}>{hero.rows[3].ratio}</p>
          <p className="[word-break:break-word] font-sans font-semibold leading-[0] relative shrink-0 text-[0px] text-right text-white tracking-[0.8271px] whitespace-nowrap" data-node-id="20:8792" style={{ fontVariationSettings: '"wdth" 100' }}>
            <span className="leading-[1.16] text-[11.816px]">{hero.rows[3].value}</span>
            <span className="font-sans font-medium leading-[1.16] text-[7.878px]" style={{ fontVariationSettings: '"wdth" 100' }}>{hero.rows[3].unit}</span>
          </p>
        </div>
        <div className="h-0 relative shrink-0 w-full" data-node-id="20:8793">
          <div className="absolute inset-[-0.04px_0]">
            <img alt="" className="block max-w-none size-full" src="/images/figma/20-8761-85776.svg" />
          </div>
        </div>
        <div className="content-stretch flex items-center justify-between relative shrink-0 w-full" data-node-id="20:8794">
          <div className="content-stretch flex gap-[7.878px] items-center relative shrink-0 w-[216.633px]" data-node-id="20:8795">
            <div className="bg-[#08442c] border-[1.264px] border-[rgba(255,255,255,0.12)] border-solid relative rounded-[1.607px] shrink-0 size-[9.847px]" data-node-id="20:8796" />
            <p className="[word-break:break-word] font-sans font-semibold leading-[1.16] relative shrink-0 text-[11.816px] text-white tracking-[0.8271px] w-[69.398px]" data-node-id="20:8797" style={{ fontVariationSettings: '"wdth" 100' }}>{hero.rows[4].label}</p>
          </div>
          <p className="[word-break:break-word] font-sans font-semibold leading-[1.16] relative shrink-0 text-[11.816px] text-center text-white tracking-[0.8271px] whitespace-nowrap" data-node-id="20:8798" style={{ fontVariationSettings: '"wdth" 100' }}>{hero.rows[4].ratio}</p>
          <p className="[word-break:break-word] font-sans font-semibold leading-[0] relative shrink-0 text-[0px] text-right text-white tracking-[0.8271px] whitespace-nowrap" data-node-id="20:8799" style={{ fontVariationSettings: '"wdth" 100' }}>
            <span className="leading-[1.16] text-[11.816px]">{hero.rows[4].value}</span>
            <span className="font-sans font-medium leading-[1.16] text-[7.878px]" style={{ fontVariationSettings: '"wdth" 100' }}>{hero.rows[4].unit}</span>
          </p>
        </div>
        <div className="h-0 relative shrink-0 w-full" data-node-id="20:8800">
          <div className="absolute inset-[-0.04px_0]">
            <img alt="" className="block max-w-none size-full" src="/images/figma/20-8761-85776.svg" />
          </div>
        </div>
        <div className="content-stretch flex items-center justify-between relative shrink-0 w-full" data-node-id="20:8801">
          <div className="flex h-[14.606px] items-center justify-center relative shrink-0 w-[201.013px]" data-node-id="20:8802">
            <div className="flex-none rotate-[0.17deg]">
              <div className="content-stretch flex gap-[7.878px] items-center relative w-[200.972px]">
                <div className="bg-[#6fefc3] border-[1.125px] border-[rgba(255,255,255,0.12)] border-solid relative rounded-[1.431px] shrink-0 size-[8.771px]" data-node-id="20:8803" />
                <p className="[word-break:break-word] font-sans font-semibold leading-[1.16] relative shrink-0 text-[11.816px] text-white tracking-[0.8271px] w-[171.65px]" data-node-id="20:8804" style={{ fontVariationSettings: '"wdth" 100' }}>{hero.rows[5].label}</p>
              </div>
            </div>
          </div>
          <p className="[word-break:break-word] font-sans font-semibold leading-[1.16] relative shrink-0 text-[11.816px] text-center text-white tracking-[0.8271px] whitespace-nowrap" data-node-id="20:8805" style={{ fontVariationSettings: '"wdth" 100' }}>{hero.rows[5].ratio}</p>
          <p className="[word-break:break-word] font-sans font-semibold leading-[0] relative shrink-0 text-[0px] text-right text-white tracking-[0.8271px] whitespace-nowrap" data-node-id="20:8806" style={{ fontVariationSettings: '"wdth" 100' }}>
            <span className="leading-[1.16] text-[11.816px]">{hero.rows[5].value}</span>
            <span className="font-sans font-medium leading-[1.16] text-[7.878px]" style={{ fontVariationSettings: '"wdth" 100' }}>{hero.rows[5].unit}</span>
          </p>
        </div>
      </div>
      <div className="-translate-x-1/2 absolute h-0 left-1/2 top-[684.03px] w-[381.273px]" data-node-id="20:8807">
        <div className="absolute inset-[-0.19px_0]">
          <img alt="" className="block max-w-none size-full" src="/images/figma/20-8761-ff14b.svg" />
        </div>
      </div>
      <div className="absolute border-[0.394px] border-[rgba(255,255,255,0.26)] border-solid h-[63.808px] left-[22.06px] overflow-clip rounded-[6.302px] top-[604.13px] w-[381.273px]" data-node-id="20:8808">
        <div className="absolute contents left-[169.85px] top-[7.05px]" data-node-id="20:8809">
          <div className="absolute bg-[#cfe0c4] left-[170.24px] rounded-[2.039px] size-[8.838px] top-[7.45px]" data-node-id="20:8810" style={hero.cell(0)} />
          <div className="absolute bg-[#cfe0c4] left-[180.44px] rounded-[2.039px] size-[8.838px] top-[7.45px]" data-node-id="20:8811" style={hero.cell(1)} />
          <div className="absolute bg-[#cfe0c4] left-[190.64px] rounded-[2.039px] size-[8.838px] top-[7.45px]" data-node-id="20:8812" style={hero.cell(2)} />
          <div className="absolute bg-[#cfe0c4] left-[200.83px] rounded-[2.039px] size-[8.838px] top-[7.45px]" data-node-id="20:8813" style={hero.cell(3)} />
          <div className="absolute bg-[#cfe0c4] left-[211.03px] rounded-[2.039px] size-[8.838px] top-[7.45px]" data-node-id="20:8814" style={hero.cell(4)} />
          <div className="absolute bg-[#cfe0c4] left-[221.23px] rounded-[2.039px] size-[8.838px] top-[7.45px]" data-node-id="20:8815" style={hero.cell(5)} />
          <div className="absolute bg-[#cfe0c4] left-[231.43px] rounded-[2.039px] size-[8.838px] top-[7.45px]" data-node-id="20:8816" style={hero.cell(6)} />
          <div className="absolute bg-[#cfe0c4] left-[241.62px] rounded-[2.039px] size-[8.838px] top-[7.45px]" data-node-id="20:8817" style={hero.cell(7)} />
          <div className="absolute bg-[#cfe0c4] left-[251.82px] rounded-[2.039px] size-[8.838px] top-[7.45px]" data-node-id="20:8818" style={hero.cell(8)} />
          <div className="absolute bg-[#cfe0c4] left-[262.02px] rounded-[2.039px] size-[8.838px] top-[7.45px]" data-node-id="20:8819" style={hero.cell(9)} />
          <div className="absolute bg-[#cfe0c4] left-[170.24px] rounded-[2.039px] size-[8.838px] top-[17.65px]" data-node-id="20:8820" style={hero.cell(10)} />
          <div className="absolute bg-[#cfe0c4] left-[180.44px] rounded-[2.039px] size-[8.838px] top-[17.65px]" data-node-id="20:8821" style={hero.cell(11)} />
          <div className="absolute bg-[#cfe0c4] left-[190.64px] rounded-[2.039px] size-[8.838px] top-[17.65px]" data-node-id="20:8822" style={hero.cell(12)} />
          <div className="absolute bg-[#cfe0c4] left-[200.83px] rounded-[2.039px] size-[8.838px] top-[17.65px]" data-node-id="20:8823" style={hero.cell(13)} />
          <div className="absolute bg-[#cfe0c4] left-[211.03px] rounded-[2.039px] size-[8.838px] top-[17.65px]" data-node-id="20:8824" style={hero.cell(14)} />
          <div className="absolute bg-[#cfe0c4] left-[221.23px] rounded-[2.039px] size-[8.838px] top-[17.65px]" data-node-id="20:8825" style={hero.cell(15)} />
          <div className="absolute bg-[#cfe0c4] left-[231.43px] rounded-[2.039px] size-[8.838px] top-[17.65px]" data-node-id="20:8826" style={hero.cell(16)} />
          <div className="absolute bg-[#cfe0c4] left-[241.62px] rounded-[2.039px] size-[8.838px] top-[17.65px]" data-node-id="20:8827" style={hero.cell(17)} />
          <div className="absolute bg-[#cfe0c4] left-[251.82px] rounded-[2.039px] size-[8.838px] top-[17.65px]" data-node-id="20:8828" style={hero.cell(18)} />
          <div className="absolute bg-[#cfe0c4] left-[262.02px] rounded-[2.039px] size-[8.838px] top-[17.65px]" data-node-id="20:8829" style={hero.cell(19)} />
          <div className="absolute bg-[#96ae65] left-[170.24px] rounded-[2.039px] size-[8.838px] top-[27.84px]" data-node-id="20:8830" style={hero.cell(20)} />
          <div className="absolute bg-[#96ae65] left-[180.44px] rounded-[2.039px] size-[8.838px] top-[27.84px]" data-node-id="20:8831" style={hero.cell(21)} />
          <div className="absolute bg-[#96ae65] left-[190.64px] rounded-[2.039px] size-[8.838px] top-[27.84px]" data-node-id="20:8832" style={hero.cell(22)} />
          <div className="absolute bg-[#96ae65] left-[200.83px] rounded-[2.039px] size-[8.838px] top-[27.85px]" data-node-id="20:8833" style={hero.cell(23)} />
          <div className="absolute bg-[#96ae65] left-[211.03px] rounded-[2.039px] size-[8.838px] top-[27.84px]" data-node-id="20:8834" style={hero.cell(24)} />
          <div className="absolute bg-[#96ae65] left-[221.23px] rounded-[2.039px] size-[8.838px] top-[27.84px]" data-node-id="20:8835" style={hero.cell(25)} />
          <div className="absolute bg-[#96ae65] left-[231.43px] rounded-[2.039px] size-[8.838px] top-[27.84px]" data-node-id="20:8836" style={hero.cell(26)} />
          <div className="absolute bg-[#96ae65] left-[241.62px] rounded-[2.039px] size-[8.838px] top-[27.84px]" data-node-id="20:8837" style={hero.cell(27)} />
          <div className="absolute bg-[#96ae65] left-[251.82px] rounded-[2.039px] size-[8.838px] top-[27.84px]" data-node-id="20:8838" style={hero.cell(28)} />
          <div className="absolute bg-[#96ae65] left-[262.02px] rounded-[2.039px] size-[8.838px] top-[27.84px]" data-node-id="20:8839" style={hero.cell(29)} />
          <div className="absolute bg-[#96ae65] left-[170.24px] rounded-[2.039px] size-[8.838px] top-[38.04px]" data-node-id="20:8840" style={hero.cell(30)} />
          <div className="absolute bg-[#96ae65] left-[180.44px] rounded-[2.039px] size-[8.838px] top-[38.04px]" data-node-id="20:8841" style={hero.cell(31)} />
          <div className="absolute bg-[#96ae65] left-[190.64px] rounded-[2.039px] size-[8.838px] top-[38.04px]" data-node-id="20:8842" style={hero.cell(32)} />
          <div className="absolute bg-[#96ae65] left-[200.83px] rounded-[2.039px] size-[8.838px] top-[38.04px]" data-node-id="20:8843" style={hero.cell(33)} />
          <div className="absolute bg-[#96ae65] left-[211.03px] rounded-[2.039px] size-[8.838px] top-[38.04px]" data-node-id="20:8844" style={hero.cell(34)} />
          <div className="absolute bg-[#96ae65] left-[221.23px] rounded-[2.039px] size-[8.838px] top-[38.04px]" data-node-id="20:8845" style={hero.cell(35)} />
          <div className="absolute bg-[#96ae65] left-[231.43px] rounded-[2.039px] size-[8.838px] top-[38.04px]" data-node-id="20:8846" style={hero.cell(36)} />
          <div className="absolute bg-[#96ae65] left-[241.62px] rounded-[2.039px] size-[8.838px] top-[38.04px]" data-node-id="20:8847" style={hero.cell(37)} />
          <div className="absolute bg-[#96ae65] left-[251.82px] rounded-[2.039px] size-[8.838px] top-[38.04px]" data-node-id="20:8848" style={hero.cell(38)} />
          <div className="absolute bg-[#96ae65] left-[262.02px] rounded-[2.039px] size-[8.838px] top-[38.04px]" data-node-id="20:8849" style={hero.cell(39)} />
          <div className="absolute bg-[#96ae65] left-[170.24px] rounded-[2.039px] size-[8.838px] top-[48.24px]" data-node-id="20:8850" style={hero.cell(40)} />
          <div className="absolute bg-[#96ae65] left-[180.44px] rounded-[2.039px] size-[8.838px] top-[48.24px]" data-node-id="20:8851" style={hero.cell(41)} />
          <div className="absolute bg-[#96ae65] left-[190.64px] rounded-[2.039px] size-[8.838px] top-[48.24px]" data-node-id="20:8852" style={hero.cell(42)} />
          <div className="absolute bg-[#96ae65] left-[200.83px] rounded-[2.039px] size-[8.838px] top-[48.24px]" data-node-id="20:8853" style={hero.cell(43)} />
          <div className="absolute bg-[#96ae65] left-[211.03px] rounded-[2.039px] size-[8.838px] top-[48.24px]" data-node-id="20:8854" style={hero.cell(44)} />
          <div className="absolute bg-[#96ae65] left-[221.23px] rounded-[2.039px] size-[8.838px] top-[48.24px]" data-node-id="20:8855" style={hero.cell(45)} />
          <div className="absolute bg-[#96ae65] left-[231.43px] rounded-[2.039px] size-[8.838px] top-[48.24px]" data-node-id="20:8856" style={hero.cell(46)} />
          <div className="absolute bg-[#96ae65] left-[241.62px] rounded-[2.039px] size-[8.838px] top-[48.24px]" data-node-id="20:8857" style={hero.cell(47)} />
          <div className="absolute bg-[#96ae65] left-[251.82px] rounded-[2.039px] size-[8.838px] top-[48.24px]" data-node-id="20:8858" style={hero.cell(48)} />
          <div className="absolute bg-[#96ae65] left-[262.02px] rounded-[2.039px] size-[8.838px] top-[48.24px]" data-node-id="20:8859" style={hero.cell(49)} />
          <div className="absolute bg-[#9cc820] left-[272.22px] rounded-[2.039px] size-[8.838px] top-[7.45px]" data-node-id="20:8860" style={hero.cell(50)} />
          <div className="absolute bg-[#9cc820] left-[282.41px] rounded-[2.039px] size-[8.838px] top-[7.45px]" data-node-id="20:8861" style={hero.cell(51)} />
          <div className="absolute bg-[#9cc820] left-[292.61px] rounded-[2.039px] size-[8.838px] top-[7.45px]" data-node-id="20:8862" style={hero.cell(52)} />
          <div className="absolute bg-[#9cc820] left-[302.81px] rounded-[2.039px] size-[8.838px] top-[7.45px]" data-node-id="20:8863" style={hero.cell(53)} />
          <div className="absolute bg-[#9cc820] left-[313.01px] rounded-[2.039px] size-[8.838px] top-[7.45px]" data-node-id="20:8864" style={hero.cell(54)} />
          <div className="absolute bg-[#9cc820] left-[323.2px] rounded-[2.039px] size-[8.838px] top-[7.45px]" data-node-id="20:8865" style={hero.cell(55)} />
          <div className="absolute bg-[#9cc820] left-[333.4px] rounded-[2.039px] size-[8.838px] top-[7.45px]" data-node-id="20:8866" style={hero.cell(56)} />
          <div className="absolute bg-[#9cc820] left-[343.6px] rounded-[2.039px] size-[8.838px] top-[7.45px]" data-node-id="20:8867" style={hero.cell(57)} />
          <div className="absolute bg-[#9cc820] left-[353.8px] rounded-[2.039px] size-[8.838px] top-[7.45px]" data-node-id="20:8868" style={hero.cell(58)} />
          <div className="absolute bg-[#9cc820] left-[363.99px] rounded-[2.039px] size-[8.838px] top-[7.45px]" data-node-id="20:8869" style={hero.cell(59)} />
          <div className="absolute bg-[#9cc820] left-[272.22px] rounded-[2.039px] size-[8.838px] top-[17.65px]" data-node-id="20:8870" style={hero.cell(60)} />
          <div className="absolute bg-[#9cc820] left-[282.41px] rounded-[2.039px] size-[8.838px] top-[17.65px]" data-node-id="20:8871" style={hero.cell(61)} />
          <div className="absolute bg-[#9cc820] left-[292.61px] rounded-[2.039px] size-[8.838px] top-[17.65px]" data-node-id="20:8872" style={hero.cell(62)} />
          <div className="absolute bg-[#9cc820] left-[302.81px] rounded-[2.039px] size-[8.838px] top-[17.65px]" data-node-id="20:8873" style={hero.cell(63)} />
          <div className="absolute bg-[#9cc820] left-[313.01px] rounded-[2.039px] size-[8.838px] top-[17.65px]" data-node-id="20:8874" style={hero.cell(64)} />
          <div className="absolute bg-[#9cc820] left-[323.2px] rounded-[2.039px] size-[8.838px] top-[17.65px]" data-node-id="20:8875" style={hero.cell(65)} />
          <div className="absolute bg-[#9cc820] left-[333.4px] rounded-[2.039px] size-[8.838px] top-[17.65px]" data-node-id="20:8876" style={hero.cell(66)} />
          <div className="absolute bg-[#9cc820] left-[343.6px] rounded-[2.039px] size-[8.838px] top-[17.65px]" data-node-id="20:8877" style={hero.cell(67)} />
          <div className="absolute bg-[#9cc820] left-[353.8px] rounded-[2.039px] size-[8.838px] top-[17.65px]" data-node-id="20:8878" style={hero.cell(68)} />
          <div className="absolute bg-[#9cc820] left-[363.99px] rounded-[2.039px] size-[8.838px] top-[17.65px]" data-node-id="20:8879" style={hero.cell(69)} />
          <div className="absolute bg-[#099385] left-[272.22px] rounded-[2.039px] size-[8.838px] top-[27.85px]" data-node-id="20:8880" style={hero.cell(70)} />
          <div className="absolute bg-[#099385] left-[282.41px] rounded-[2.039px] size-[8.838px] top-[27.84px]" data-node-id="20:8881" style={hero.cell(71)} />
          <div className="absolute bg-[#099385] left-[292.61px] rounded-[2.039px] size-[8.838px] top-[27.84px]" data-node-id="20:8882" style={hero.cell(72)} />
          <div className="absolute bg-[#099385] left-[302.81px] rounded-[2.039px] size-[8.838px] top-[27.84px]" data-node-id="20:8883" style={hero.cell(73)} />
          <div className="absolute bg-[#099385] left-[313.01px] rounded-[2.039px] size-[8.838px] top-[27.84px]" data-node-id="20:8884" style={hero.cell(74)} />
          <div className="absolute bg-[#099385] left-[323.2px] rounded-[2.039px] size-[8.838px] top-[27.84px]" data-node-id="20:8885" style={hero.cell(75)} />
          <div className="absolute bg-[#099385] left-[333.4px] rounded-[2.039px] size-[8.838px] top-[27.84px]" data-node-id="20:8886" style={hero.cell(76)} />
          <div className="absolute bg-[#099385] left-[343.6px] rounded-[2.039px] size-[8.838px] top-[27.84px]" data-node-id="20:8887" style={hero.cell(77)} />
          <div className="absolute bg-[#099385] left-[353.8px] rounded-[2.039px] size-[8.838px] top-[27.85px]" data-node-id="20:8888" style={hero.cell(78)} />
          <div className="absolute bg-[#099385] left-[363.99px] rounded-[2.039px] size-[8.838px] top-[27.84px]" data-node-id="20:8889" style={hero.cell(79)} />
          <div className="absolute bg-[#099385] left-[272.22px] rounded-[2.039px] size-[8.838px] top-[38.04px]" data-node-id="20:8890" style={hero.cell(80)} />
          <div className="absolute bg-[#099385] left-[282.41px] rounded-[2.039px] size-[8.838px] top-[38.04px]" data-node-id="20:8891" style={hero.cell(81)} />
          <div className="absolute bg-[#099385] left-[292.61px] rounded-[2.039px] size-[8.838px] top-[38.04px]" data-node-id="20:8892" style={hero.cell(82)} />
          <div className="absolute bg-[#099385] left-[302.81px] rounded-[2.039px] size-[8.838px] top-[38.04px]" data-node-id="20:8893" style={hero.cell(83)} />
          <div className="absolute bg-[#099385] left-[313.01px] rounded-[2.039px] size-[8.838px] top-[38.04px]" data-node-id="20:8894" style={hero.cell(84)} />
          <div className="absolute bg-[#099385] left-[323.2px] rounded-[2.039px] size-[8.838px] top-[38.04px]" data-node-id="20:8895" style={hero.cell(85)} />
          <div className="absolute bg-[#099385] left-[333.4px] rounded-[2.039px] size-[8.838px] top-[38.04px]" data-node-id="20:8896" style={hero.cell(86)} />
          <div className="absolute bg-[#08442c] left-[343.6px] rounded-[2.039px] size-[8.838px] top-[38.04px]" data-node-id="20:8897" style={hero.cell(87)} />
          <div className="absolute bg-[#08442c] left-[353.8px] rounded-[2.039px] size-[8.838px] top-[38.04px]" data-node-id="20:8898" style={hero.cell(88)} />
          <div className="absolute bg-[#08442c] left-[363.99px] rounded-[2.039px] size-[8.838px] top-[38.04px]" data-node-id="20:8899" style={hero.cell(89)} />
          <div className="absolute bg-[#08442c] left-[272.22px] rounded-[2.039px] size-[8.838px] top-[48.24px]" data-node-id="20:8900" style={hero.cell(90)} />
          <div className="absolute bg-[#08442c] left-[282.41px] rounded-[2.039px] size-[8.838px] top-[48.24px]" data-node-id="20:8901" style={hero.cell(91)} />
          <div className="absolute bg-[#08442c] left-[292.61px] rounded-[2.039px] size-[8.838px] top-[48.24px]" data-node-id="20:8902" style={hero.cell(92)} />
          <div className="absolute bg-[#08442c] left-[302.81px] rounded-[2.039px] size-[8.838px] top-[48.24px]" data-node-id="20:8903" style={hero.cell(93)} />
          <div className="absolute bg-[#08442c] left-[313.01px] rounded-[2.039px] size-[8.838px] top-[48.24px]" data-node-id="20:8904" style={hero.cell(94)} />
          <div className="absolute bg-[#08442c] left-[323.2px] rounded-[2.039px] size-[8.838px] top-[48.24px]" data-node-id="20:8905" style={hero.cell(95)} />
          <div className="absolute bg-[#08442c] left-[333.4px] rounded-[2.039px] size-[8.838px] top-[48.24px]" data-node-id="20:8906" style={hero.cell(96)} />
          <div className="absolute bg-[#6fefc3] left-[343.6px] rounded-[2.039px] size-[8.838px] top-[48.24px]" data-node-id="20:8907" style={hero.cell(97)} />
          <div className="absolute bg-[#6fefc3] left-[353.8px] rounded-[2.039px] size-[8.838px] top-[48.24px]" data-node-id="20:8908" style={hero.cell(98)} />
          <div className="absolute bg-[#6fefc3] left-[363.99px] rounded-[2.039px] size-[8.838px] top-[48.24px]" data-node-id="20:8909" style={hero.cell(99)} />
        </div>
        <p className="-translate-x-full [word-break:break-word] absolute font-sans font-semibold leading-[1.16] left-[calc(50%-57.44px)] text-[9.847px] text-right text-white top-[6.44px] tracking-[0.6893px] whitespace-nowrap" data-node-id="20:8910" style={{ fontVariationSettings: '"wdth" 100' }}>Each cell = 1% of supply</p>
        <p className="-translate-x-full [word-break:break-word] absolute font-sans font-semibold leading-[1.16] left-[calc(50%-82.12px)] text-[9.847px] text-right text-white top-[20.38px] tracking-[0.6893px] whitespace-nowrap" data-node-id="20:8911" style={{ fontVariationSettings: '"wdth" 100' }}>{`Total fractions: ${hero.maximum}`}</p>
      </div>
      <div className="absolute content-stretch flex flex-col gap-[9.453px] items-center left-[18.12px] top-[45.91px] w-[389.151px]" data-node-id="20:8912">
        <div className="h-[34.702px] relative rounded-[4.771px] shrink-0 w-[69.758px]" data-node-id="20:8913" data-name="INFRA_Logo_dark">
          <div className="-translate-x-1/2 -translate-y-1/2 absolute content-stretch flex flex-col items-center left-[calc(50%+0.08px)] top-[calc(50%+0.01px)] w-[82.793px]" data-node-id="20:8914">
            <p className="[word-break:break-word] font-[family-name:var(--font-montserrat)] font-bold leading-none min-w-full relative shrink-0 text-[21.762px] text-center text-white w-[min-content]" data-node-id="20:8915">
              INFRA
            </p>
            <div className="grid-cols-[max-content] grid-rows-[max-content] inline-grid leading-[0] place-items-start relative shrink-0" data-node-id="20:8916">
              <div className="bg-white col-1 h-[1.987px] ml-0 mt-0 relative row-1 w-[71.281px]" data-node-id="20:8917" />
              <div className="bg-white col-1 h-[1.987px] ml-0 mt-[3.57px] relative row-1 w-[71.281px]" data-node-id="20:8918" />
            </div>
          </div>
        </div>
        <div className="content-stretch flex flex-col gap-[10.241px] h-[109.498px] items-center justify-center relative shrink-0" data-node-id="20:8919">
          <div className="[word-break:break-word] content-stretch flex flex-col gap-[5.12px] items-center justify-center leading-[normal] relative shrink-0 text-center w-[358.016px]" data-node-id="20:8920">
            <p className="font-sans font-semibold min-w-full relative shrink-0 text-[15.894px] text-white w-[min-content]" data-node-id="20:8921" style={{ fontVariationSettings: '"wdth" 100' }}>
              Blockchain Infrastructure for Payments
            </p>
            <p className="font-sans font-medium relative shrink-0 text-[#dbdbdb] text-[9.934px] w-[375.2px]" data-node-id="20:8922" style={{ fontVariationSettings: '"wdth" 100' }}>
              INFRA UAT blockchain network. Review published project prices and confirmed revenue deposits before investing.
            </p>
          </div>
          <div className="backdrop-blur-[4.648px] bg-[rgba(255,255,255,0.05)] border-[0.308px] border-[rgba(255,255,255,0.5)] border-solid h-[47.265px] overflow-clip relative rounded-[5.96px] shrink-0 w-[232.388px]" data-node-id="20:8923">
            <div className="-translate-x-1/2 -translate-y-1/2 absolute content-stretch flex gap-[14.16px] items-center left-[calc(50%+0.01px)] top-[calc(50%+0.34px)]" data-node-id="20:8924">
              <div className="[word-break:break-word] font-sans font-semibold leading-[0] relative shrink-0 text-[0px] text-center text-white tracking-[0.8619px] whitespace-nowrap" data-node-id="20:8925" style={{ fontVariationSettings: '"wdth" 100' }}>
                <p className="leading-[1.68] mb-0 text-[#ffec1c] text-[12.313px]">reAED</p>
                <p className="font-sans font-medium leading-[1.68] text-[7.696px]" style={{ fontVariationSettings: '"wdth" 100' }}>
                  Native asset
                </p>
              </div>
              <div className="h-[25.128px] relative shrink-0 w-0" data-node-id="20:8926">
                <div className="absolute inset-[0_-0.07px]">
                  <img alt="" className="block max-w-none size-full" src="/images/figma/20-8761-e91cf.svg" />
                </div>
              </div>
              <div className="[word-break:break-word] font-sans font-semibold leading-[0] relative shrink-0 text-[0px] text-center text-white tracking-[0.8619px] whitespace-nowrap" data-node-id="20:8927" style={{ fontVariationSettings: '"wdth" 100' }}>
                <p className="leading-[1.68] mb-0 text-[#ffec1c] text-[12.313px]">15324</p>
                <p className="font-sans font-medium leading-[1.68] text-[7.696px]" style={{ fontVariationSettings: '"wdth" 100' }}>
                  INFRA chain
                </p>
              </div>
              <div className="h-[25.128px] relative shrink-0 w-0" data-node-id="20:8928">
                <div className="absolute inset-[0_-0.07px]">
                  <img alt="" className="block max-w-none size-full" src="/images/figma/20-8761-e91cf.svg" />
                </div>
              </div>
              <div className="[word-break:break-word] font-sans font-semibold leading-[0] relative shrink-0 text-[0px] text-center text-white tracking-[0.8619px] whitespace-nowrap" data-node-id="20:8929" style={{ fontVariationSettings: '"wdth" 100' }}>
                <p className="leading-[1.68] mb-0 text-[#ffec1c] text-[12.313px]">UAT</p>
                <p className="font-sans font-medium leading-[1.68] text-[7.696px]" style={{ fontVariationSettings: '"wdth" 100' }}>
                  Network
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="backdrop-blur-[7.436px] bg-[rgba(0,0,0,0.2)] border-[0.161px] border-solid border-white content-stretch flex flex-col h-[55.931px] items-center justify-center py-[3.859px] relative rounded-[6.431px] shrink-0 w-full" data-node-id="20:8930">
          <div className="content-stretch flex gap-[8.665px] items-center relative shrink-0 w-[373.396px]" data-node-id="20:8931">
            <div className="[word-break:break-word] content-stretch flex flex-col gap-[4.727px] items-center justify-center leading-[1.16] relative shrink-0 text-center w-[44.902px]" data-node-id="20:8932">
              <p className="font-sans font-medium relative shrink-0 text-[9.847px] text-white tracking-[0.6893px] w-[44.558px]" data-node-id="20:8933" style={{ fontVariationSettings: '"wdth" 100' }}>{`Total fractions`}</p>
              <p className="font-sans font-semibold min-w-full relative shrink-0 text-[#f6ff00] text-[13.786px] tracking-[0.965px] w-[min-content]" data-node-id="20:8934" style={{ fontVariationSettings: '"wdth" 100' }}>{hero.maximum}</p>
            </div>
            <div className="h-[43.72px] relative shrink-0 w-0" data-node-id="20:8935">
              <div className="absolute inset-[0_-0.07px]">
                <img alt="" className="block max-w-none size-full" src="/images/figma/20-8761-c41ed.svg" />
              </div>
            </div>
            <div className="[word-break:break-word] content-stretch flex flex-col gap-[4.727px] items-center relative shrink-0 text-center text-white w-[81.927px]" data-node-id="20:8936">
              <p className="font-sans font-medium leading-[1.16] relative shrink-0 text-[9.847px] tracking-[0.6893px] w-[89.806px]" data-node-id="20:8937" style={{ fontVariationSettings: '"wdth" 100' }}>Available fractions</p>
              <p className="font-sans font-semibold leading-[0] min-w-full relative shrink-0 text-[0px] tracking-[0.8795px] w-[min-content]" data-node-id="20:8938" style={{ fontVariationSettings: '"wdth" 100' }}>
                <span className="leading-[1.16] text-[#f6ff00] text-[13.786px]">{hero.remaining}</span>
                <span className="leading-[1.16] text-[7.09px]" style={{ fontVariationSettings: '"wdth" 100' }}>fractions</span>
              </p>
            </div>
            <div className="h-[43.72px] relative shrink-0 w-0" data-node-id="20:8939">
              <div className="absolute inset-[0_-0.07px]">
                <img alt="" className="block max-w-none size-full" src="/images/figma/20-8761-c41ed.svg" />
              </div>
            </div>
            <div className="[word-break:break-word] content-stretch flex flex-col gap-[4.727px] items-center relative shrink-0 text-center text-white w-[94.531px]" data-node-id="20:8940">
              <p className="font-sans font-medium leading-[1.16] relative shrink-0 text-[9.847px] tracking-[0.6893px] w-[59.509px]" data-node-id="20:8941" style={{ fontVariationSettings: '"wdth" 100' }}>Price per fraction</p>
              <p className="font-sans font-semibold leading-[0] relative shrink-0 text-[0px] tracking-[0.8795px] whitespace-nowrap" data-node-id="20:8942" style={{ fontVariationSettings: '"wdth" 100' }}>
                <span className="font-sans font-medium leading-[1.16] text-[7.09px]" style={{ fontVariationSettings: '"wdth" 100' }}>
                  reAED
                </span>
                <span className="leading-[1.16] text-[#f6ff00] text-[13.786px]">{hero.priceNative}</span>
                <span className="font-sans font-medium leading-[1.16] text-[7.09px]" style={{ fontVariationSettings: '"wdth" 100' }}>per fraction</span>
              </p>
            </div>
            <div className="h-[43.72px] relative shrink-0 w-0" data-node-id="20:8943">
              <div className="absolute inset-[0_-0.07px]">
                <img alt="" className="block max-w-none size-full" src="/images/figma/20-8761-c41ed.svg" />
              </div>
            </div>
            <div className="[word-break:break-word] content-stretch flex flex-col gap-[4.727px] items-center relative shrink-0 text-center text-white w-[89.41px]" data-node-id="20:8944">
              <p className="font-sans font-medium leading-[1.16] min-w-full relative shrink-0 text-[9.847px] tracking-[0.6893px] w-[min-content]" data-node-id="20:8945" style={{ fontVariationSettings: '"wdth" 100' }}>Price per fraction</p>
              <p className="font-sans font-semibold leading-[0] relative shrink-0 text-[0px] tracking-[0.8795px] whitespace-nowrap" data-node-id="20:8946" style={{ fontVariationSettings: '"wdth" 100' }}>
                <span className="leading-[1.16] text-[7.09px]">USDT</span>
                <span className="leading-[1.16] text-[#f6ff00] text-[13.786px]">{hero.priceUsdt}</span>
                <span className="leading-[1.16] text-[7.09px]" style={{ fontVariationSettings: '"wdth" 100' }}>per fraction</span>
              </p>
            </div>
          </div>
        </div>
        <div className="bg-[rgba(0,0,0,0.5)] border-[0.394px] border-[rgba(255,255,255,0.22)] border-solid h-[145.735px] overflow-clip relative rounded-[5.908px] shrink-0 w-full" data-node-id="20:8947">
          <p className="[word-break:break-word] absolute font-sans font-semibold leading-[1.16] left-[11.57px] text-[#9d9d9d] text-[9.847px] top-[7.3px] tracking-[0.6893px] whitespace-nowrap" data-node-id="20:8948" style={{ fontVariationSettings: '"wdth" 100' }}>
            Why Invest
          </p>
          <div className="[word-break:break-word] absolute content-stretch flex flex-col gap-[7.484px] items-start leading-[1.16] left-[11.42px] top-[29.54px] w-[122.496px]" data-node-id="20:8949">
            <div className="content-stretch flex flex-col gap-[3.939px] items-start relative shrink-0 w-[105.165px]" data-node-id="20:8950">
              <p className="font-sans font-semibold relative shrink-0 text-[8.665px] text-white tracking-[0.6066px] w-full" data-node-id="20:8951" style={{ fontVariationSettings: '"wdth" 100' }}>
                Real Demand
              </p>
              <p className="font-sans font-normal relative shrink-0 text-[#bababa] text-[7.09px] tracking-[0.4963px] w-full" data-node-id="20:8952" style={{ fontVariationSettings: '"wdth" 100' }}>
                Revenue is allocated only from funded deposits.
              </p>
            </div>
            <div className="content-stretch flex flex-col gap-[3.939px] items-start relative shrink-0 w-[119.345px]" data-node-id="20:8953">
              <p className="font-sans font-semibold relative shrink-0 text-[8.665px] text-white tracking-[0.6066px] w-full" data-node-id="20:8954" style={{ fontVariationSettings: '"wdth" 100' }}>
                Enterprise Coins
              </p>
              <p className="font-sans font-normal relative shrink-0 text-[#bababa] text-[7.09px] tracking-[0.4963px] w-full" data-node-id="20:8955" style={{ fontVariationSettings: '"wdth" 100' }}>
                Companies launch stablecoins. INFRA captures fees.
              </p>
            </div>
            <div className="content-stretch flex flex-col gap-[3.939px] items-start relative shrink-0 w-[105.165px]" data-node-id="20:8956">
              <p className="font-sans font-semibold relative shrink-0 text-[8.665px] text-white tracking-[0.6066px] w-full" data-node-id="20:8957" style={{ fontVariationSettings: '"wdth" 100' }}>
                Regulatory
              </p>
              <p className="font-sans font-normal relative shrink-0 text-[#bababa] text-[7.09px] tracking-[0.4963px] w-full" data-node-id="20:8958" style={{ fontVariationSettings: '"wdth" 100' }}>
                INFRA UAT blockchain network, chain ID 15324.
              </p>
            </div>
          </div>
          <div className="-translate-x-1/2 [word-break:break-word] absolute content-stretch flex flex-col gap-[7.484px] items-start leading-[1.16] left-[calc(50%+3.94px)] top-[29.54px] w-[86.653px]" data-node-id="20:8959">
            <div className="content-stretch flex flex-col gap-[3.939px] items-start relative shrink-0 w-full" data-node-id="20:8960">
              <p className="font-sans font-semibold relative shrink-0 text-[8.665px] text-white tracking-[0.6066px] w-full" data-node-id="20:8961" style={{ fontVariationSettings: '"wdth" 100' }}>
                Stable
              </p>
              <p className="font-sans font-normal relative shrink-0 text-[#bababa] text-[7.09px] tracking-[0.4963px] w-full" data-node-id="20:8962" style={{ fontVariationSettings: '"wdth" 100' }}>
                Pay with native reAED or USDT on INFRA.
              </p>
            </div>
            <div className="content-stretch flex flex-col gap-[3.939px] items-start relative shrink-0 w-full" data-node-id="20:8963">
              <p className="font-sans font-semibold relative shrink-0 text-[8.665px] text-white tracking-[0.6066px] w-full" data-node-id="20:8964" style={{ fontVariationSettings: '"wdth" 100' }}>
                Predictable
              </p>
              <p className="font-sans font-normal relative shrink-0 text-[#bababa] text-[7.09px] tracking-[0.4963px] w-full" data-node-id="20:8965" style={{ fontVariationSettings: '"wdth" 100' }}>
                Review the current network fee before approval.
              </p>
            </div>
            <div className="content-stretch flex flex-col gap-[3.939px] items-start relative shrink-0 w-full" data-node-id="20:8966">
              <p className="font-sans font-semibold relative shrink-0 text-[8.665px] text-white tracking-[0.6066px] w-full" data-node-id="20:8967" style={{ fontVariationSettings: '"wdth" 100' }}>
                Composable
              </p>
              <p className="font-sans font-normal relative shrink-0 text-[#bababa] text-[7.09px] tracking-[0.4963px] w-full" data-node-id="20:8968" style={{ fontVariationSettings: '"wdth" 100' }}>
                Custom stablecoins. Enterprise control.
              </p>
            </div>
          </div>
          <div className="[word-break:break-word] absolute content-stretch flex flex-col gap-[7.484px] items-start leading-[1.16] left-[282.02px] top-[29.54px] w-[97.682px]" data-node-id="20:8969">
            <div className="content-stretch flex flex-col gap-[3.939px] items-start relative shrink-0 w-full" data-node-id="20:8970">
              <p className="font-sans font-semibold relative shrink-0 text-[8.665px] text-white tracking-[0.6066px] w-full" data-node-id="20:8971" style={{ fontVariationSettings: '"wdth" 100' }}>
                Volume
              </p>
              <p className="font-sans font-normal relative shrink-0 text-[#bababa] text-[7.09px] tracking-[0.4963px] w-full" data-node-id="20:8972" style={{ fontVariationSettings: '"wdth" 100' }}>
                Future revenue depends on actual project funding.
              </p>
            </div>
            <div className="content-stretch flex flex-col gap-[3.939px] items-start relative shrink-0 w-full" data-node-id="20:8973">
              <p className="font-sans font-semibold relative shrink-0 text-[8.665px] text-white tracking-[0.6066px] w-full" data-node-id="20:8974" style={{ fontVariationSettings: '"wdth" 100' }}>
                Network
              </p>
              <p className="font-sans font-normal relative shrink-0 text-[#bababa] text-[7.09px] tracking-[0.4963px] w-full" data-node-id="20:8975" style={{ fontVariationSettings: '"wdth" 100' }}>
                Rewards require actual funded deposits.
              </p>
            </div>
            <div className="content-stretch flex flex-col gap-[3.939px] items-start relative shrink-0 w-full" data-node-id="20:8976">
              <p className="font-sans font-semibold relative shrink-0 text-[8.665px] text-white tracking-[0.6066px] w-full" data-node-id="20:8977" style={{ fontVariationSettings: '"wdth" 100' }}>
                Liquidity
              </p>
              <p className="font-sans font-normal relative shrink-0 text-[#bababa] text-[7.09px] tracking-[0.4963px] w-full" data-node-id="20:8978" style={{ fontVariationSettings: '"wdth" 100' }}>
                Resale needs a willing buyer.
              </p>
            </div>
          </div>
          <p className="[word-break:break-word] absolute font-sans font-semibold leading-[1.16] left-[154.79px] text-[#9d9d9d] text-[9.847px] top-[7.31px] tracking-[0.6893px] whitespace-nowrap" data-node-id="20:8979" style={{ fontVariationSettings: '"wdth" 100' }}>
            Core Features
          </p>
          <p className="[word-break:break-word] absolute font-sans font-semibold leading-[1.16] left-[282.02px] text-[#9d9d9d] text-[9.847px] top-[7.3px] tracking-[0.6893px] whitespace-nowrap" data-node-id="20:8980" style={{ fontVariationSettings: '"wdth" 100' }}>
            How rewards work
          </p>
          <div className="absolute h-0 left-[11.57px] top-[23px] w-[368.027px]" data-node-id="20:8981">
            <div className="absolute inset-[-0.05px_0]">
              <img alt="" className="block max-w-none size-full" src="/images/figma/20-8761-759a1.svg" />
            </div>
          </div>
        </div>
      </div>
      <div className="-translate-x-1/2 absolute content-stretch flex items-center justify-between left-1/2 top-[692.88px] w-[381.273px]" data-node-id="20:8982">
        <p className="[word-break:break-word] font-sans font-semibold leading-[1.16] mr-[-48.841px] relative shrink-0 text-[9.847px] text-white tracking-[0.6893px] whitespace-nowrap" data-node-id="20:8983" style={{ fontVariationSettings: '"wdth" 100' }}>
          Review project
        </p>
        <div className="content-stretch flex gap-[8.271px] items-center relative shrink-0" data-node-id="20:8984">
          <a href={hero.href} className="bg-[#0091ff] content-stretch flex items-center justify-center px-[6.939px] py-[3.806px] relative rounded-[3.331px] shrink-0" data-node-id="20:8985">
            <p className="[word-break:break-word] font-sans font-semibold leading-[1.16] relative shrink-0 text-[8.372px] text-black text-center tracking-[0.5861px] whitespace-nowrap" data-node-id="20:8986" style={{ fontVariationSettings: '"wdth" 100' }}>{hero.status === "Sale open" ? "Invest with reAED" : "Explore projects"}</p>
          </a>
          <a href={hero.href} className="bg-[#0091ff] content-stretch flex items-center justify-center px-[6.939px] py-[3.806px] relative rounded-[3.331px] shrink-0" data-node-id="20:8987">
            <p className="[word-break:break-word] font-sans font-semibold leading-[1.16] relative shrink-0 text-[8.372px] text-black text-center tracking-[0.5861px] whitespace-nowrap" data-node-id="20:8988" style={{ fontVariationSettings: '"wdth" 100' }}>{hero.status === "Sale open" ? "Invest with USDT" : "Explore projects"}</p>
          </a>
          <a href={hero.href} className="bg-[#0091ff] content-stretch flex items-center justify-center px-[6.939px] py-[3.806px] relative rounded-[3.331px] shrink-0" data-node-id="20:8989">
            <p className="[word-break:break-word] font-sans font-semibold leading-[1.16] relative shrink-0 text-[8.372px] text-black text-center tracking-[0.5861px] whitespace-nowrap" data-node-id="20:8990" style={{ fontVariationSettings: '"wdth" 100' }}>View project</p>
          </a>
        </div>
      </div>
    </div>
  );
}

