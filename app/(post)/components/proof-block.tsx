import type { ReactNode } from "react";
import {
  mdxInsetClass,
  mdxMutedTextClass,
  mdxPanelClass,
  mdxSubtleTextClass,
} from "./surface";

type ProofBlockProps = {
  title?: string;
  strategy?: string;
  children: ReactNode;
  conclusion?: ReactNode;
};

export function ProofBlock({
  title = "Proof sketch",
  strategy,
  children,
  conclusion,
}: ProofBlockProps) {
  return (
    <section className={mdxPanelClass}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-2">
          <p className={mdxSubtleTextClass}>Proof</p>
          <h3 className="text-lg font-semibold text-slate-950 dark:text-white">
            {title}
          </h3>
        </div>
        {strategy ? (
          <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
            {strategy}
          </span>
        ) : null}
      </div>

      <div className={`${mdxInsetClass} mt-5 px-4 py-4 sm:px-5`}>
        <div className="space-y-3 text-sm leading-7 text-slate-700 dark:text-slate-200">
          {children}
        </div>
      </div>

      {conclusion ? (
        <div className={`mt-4 rounded-2xl border border-emerald-200/80 bg-emerald-50/80 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-200`}>
          {conclusion}
        </div>
      ) : null}
    </section>
  );
}
