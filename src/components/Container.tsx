import type { ReactNode } from "react";

export function Container({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`mx-auto w-full px-5 sm:px-6 min-[85rem]:px-12 ${className}`}>{children}</div>;
}
