import type { ReactNode } from "react";

export function LI({ children }: { children?: ReactNode }) {
  return <li className="pl-1 leading-7">{children}</li>;
}
