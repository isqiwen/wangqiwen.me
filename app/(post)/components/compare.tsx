import type { ReactNode } from "react";
import {
  mdxInsetClass,
  mdxMutedTextClass,
  mdxPanelClass,
  mdxSubtleTextClass,
} from "./surface";

type CompareProps = {
  leftTitle: string;
  rightTitle: string;
  left: ReactNode;
  right: ReactNode;
};

export function Compare({ leftTitle, rightTitle, left, right }: CompareProps) {
  return (
    <div className={`${mdxPanelClass} grid gap-4 md:grid-cols-2`}>
      <CompareColumn title={leftTitle}>{left}</CompareColumn>
      <CompareColumn title={rightTitle}>{right}</CompareColumn>
    </div>
  );
}

function CompareColumn({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className={`${mdxInsetClass} space-y-3 p-4 shadow-sm`}>
      <p className={mdxSubtleTextClass}>{title}</p>
      <div className={`text-base ${mdxMutedTextClass}`}>{children}</div>
    </div>
  );
}
