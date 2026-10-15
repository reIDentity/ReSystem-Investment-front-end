import Image from "next/image";

interface LogoProps {
  className?: string;
  tone?: "dark" | "light";
}

/** Original Figma marks, with the lockup's native geometry. */
export function Logo({ className = "", tone = "dark" }: LogoProps) {
  const light = tone === "light";
  return (
    <span className={`brand-logo-shell ${light ? "brand-logo-light" : ""} ${className}`}>
      <span className="brand-logo">
        <span className="brand-logo-symbol">
          <Image src={light ? "/images/figma/25-10762-2dccc.svg" : "/images/figma/55-13201-fae4b.svg"} alt="" width={light ? 17.174 : 14.657} height={light ? 17.171 : 14.654} />
        </span>
        <span className="brand-wordmark">
          <Image src={light ? "/images/figma/25-10762-4561c.svg" : "/images/figma/55-13201-475c2.svg"} alt="" width={light ? 20.922 : 24.653} height={light ? 13.949 : 16.436} />
          <span>System Investment</span>
        </span>
      </span>
    </span>
  );
}
