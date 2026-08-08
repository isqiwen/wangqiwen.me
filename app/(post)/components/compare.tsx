import type { ReactNode } from "react";
import {
  mdxMutedTextClass,
} from "./surface";

type CompareProps = {
  leftTitle: string;
  rightTitle: string;
  left: ReactNode;
  right: ReactNode;
};

export function Compare({ leftTitle, rightTitle, left, right }: CompareProps) {
  return (
    <section className="my-10 grid divide-y divide-slate-200/80 border-y border-slate-200/80 dark:divide-white/10 dark:border-white/10 md:grid-cols-2 md:divide-x md:divide-y-0">
      <CompareColumn title={leftTitle}>{left}</CompareColumn>
      <CompareColumn title={rightTitle} secondary>{right}</CompareColumn>
    </section>
  );
}

function CompareColumn({
  title,
  children,
  secondary = false,
}: {
  title: string;
  children: ReactNode;
  secondary?: boolean;
}) {
  return (
    <div className={`space-y-3 py-4 ${secondary ? "md:pl-6" : "md:pr-6"}`}>
      <p className="font-semibold text-slate-900 dark:text-white">{title}</p>
      <div className={`text-base ${mdxMutedTextClass}`}>{children}</div>
    </div>
  );
}
