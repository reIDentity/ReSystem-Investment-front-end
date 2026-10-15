import type { CSSProperties } from "react";

const DIGITS = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];

interface RollingNumberProps {
  /** Already formatted text, e.g. "$96,400" or "12.5%". Digits roll, everything else stays put. */
  value: string;
  /** While false every digit rests on 0, so flipping it to true rolls the number in. */
  ready?: boolean;
  className?: string;
}

/** Odometer-style number. Digits are keyed from the right so units stay units as the number grows. */
export function RollingNumber({ value, ready = true, className = "" }: RollingNumberProps) {
  const chars = [...value];
  return (
    <span className={`relative inline-block tabular-nums ${className}`}>
      <span className="sr-only">{value}</span>
      <span aria-hidden className="roll">
        {chars.map((ch, i) => {
          const key = chars.length - i;
          if (ch < "0" || ch > "9") {
            return (
              <span key={`c${key}`} className="roll-char">
                {ch}
              </span>
            );
          }
          return (
            <span key={`d${key}`} className="roll-digit">
              <span
                className="roll-strip"
                style={{ "--n": ready ? Number(ch) : 0, "--rd": `${i * 30}ms` } as CSSProperties}
              >
                {DIGITS.map((d) => (
                  <span key={d}>{d}</span>
                ))}
              </span>
            </span>
          );
        })}
      </span>
    </span>
  );
}
