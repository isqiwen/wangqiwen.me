import type { ReactNode } from "react";
import { mdxPanelClass, mdxSubtleTextClass } from "./surface";

type DiffProps = {
  beforeTitle?: string;
  afterTitle?: string;
  before: ReactNode;
  after: ReactNode;
};

export function Diff({ beforeTitle = "Before", afterTitle = "After", before, after }: DiffProps) {
  return (
    <div className={`${mdxPanelClass} grid gap-4 md:grid-cols-2`}>
      <DiffColumn
        title={beforeTitle}
        tone="before"
      >
        {before}
      </DiffColumn>
      <DiffColumn
        title={afterTitle}
        tone="after"
      >
        {after}
      </DiffColumn>
    </div>
  );
}

function DiffColumn({
  title,
  tone,
  children,
}: {
  title: string;
  tone: "before" | "after";
  children: ReactNode;
}) {
  const toneClass =
    tone === "before"
      ? "border-rose-200/80 bg-rose-50/80 text-rose-950 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-100"
      : "border-emerald-200/80 bg-emerald-50/80 text-emerald-950 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-100";

  const eyebrowClass =
    tone === "before"
      ? "text-rose-600 dark:text-rose-300"
      : "text-emerald-600 dark:text-emerald-300";

  return (
    <div className={`space-y-3 rounded-2xl border p-4 shadow-sm ${toneClass}`}>
      <p className={`${mdxSubtleTextClass} ${eyebrowClass}`}>{title}</p>
      <div className="whitespace-pre-wrap rounded-xl bg-white/60 p-3 font-mono text-xs leading-relaxed dark:bg-black/10">
        {children}
      </div>
    </div>
  );
}
