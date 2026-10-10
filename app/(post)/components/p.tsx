import type { ReactNode } from "react";

export function P({ children }: { children?: ReactNode }) {
  return <p className="my-5 [blockquote_&]:my-2">{children}</p>;
}
