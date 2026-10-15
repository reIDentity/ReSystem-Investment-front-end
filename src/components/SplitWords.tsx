import type { CSSProperties } from "react";

/** Wraps each word so headlines can lift in word by word (see .word in globals.css). */
export function SplitWords({ text, start = 0, delay = 0 }: { text: string; start?: number; delay?: number }) {
  const words = text.split(" ");
  return (
    <>
      {words.map((w, i) => (
        <span key={i}>
          <span className="word" style={{ "--i": start + i, "--d": `${delay}ms` } as CSSProperties}>
            {w}
          </span>
          {i < words.length - 1 ? " " : null}
        </span>
      ))}
    </>
  );
}
