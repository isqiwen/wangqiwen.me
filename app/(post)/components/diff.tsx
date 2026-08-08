import type { ReactNode } from "react";

type DiffProps = {
  beforeTitle?: string;
  afterTitle?: string;
  before: ReactNode;
  after: ReactNode;
};

export function Diff({ beforeTitle = "Before", afterTitle = "After", before, after }: DiffProps) {
  return (
    <section className="my-10 grid gap-x-8 gap-y-6 md:grid-cols-2">
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
    </section>
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
  const toneClass = tone === "before" ? "border-slate-400" : "border-slate-900 dark:border-white";

  return (
    <div className={`space-y-3 border-l-2 pl-4 ${toneClass}`}>
      <p className="font-semibold text-slate-900 dark:text-white">{title}</p>
      <div className="whitespace-pre-wrap font-mono text-xs leading-relaxed text-slate-700 dark:text-slate-200">
        {children}
      </div>
    </div>
  );
}
