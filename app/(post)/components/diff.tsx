import type { ReactNode } from "react";

type DiffProps = {
  beforeTitle?: string;
  afterTitle?: string;
  before: ReactNode;
  after: ReactNode;
};

export function Diff({ beforeTitle = "Before", afterTitle = "After", before, after }: DiffProps) {
  return (
    <div className="my-4 grid gap-4 rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur md:grid-cols-2">
      <div className="space-y-2 rounded-2xl border border-red-100/60 bg-red-50/60 p-3 text-sm text-red-900 dark:border-red-900/40 dark:bg-red-950/40 dark:text-red-100">
        <p className="text-xs uppercase tracking-[0.3em] text-red-500">{beforeTitle}</p>
        <div className="whitespace-pre-wrap font-mono text-xs leading-relaxed">{before}</div>
      </div>
      <div className="space-y-2 rounded-2xl border border-emerald-100/60 bg-emerald-50/60 p-3 text-sm text-emerald-900 dark:border-emerald-900/40 dark:bg-emerald-950/40 dark:text-emerald-100">
        <p className="text-xs uppercase tracking-[0.3em] text-emerald-500">{afterTitle}</p>
        <div className="whitespace-pre-wrap font-mono text-xs leading-relaxed">{after}</div>
      </div>
    </div>
  );
}
