import type { ReactNode } from "react";
import {
  mdxInsetClass,
  mdxMutedTextClass,
  mdxPanelClass,
  mdxSubtleTextClass,
} from "./surface";

type TheoremBlockProps = {
  kind?:
    | "theorem"
    | "definition"
    | "lemma"
    | "proposition"
    | "corollary"
    | "assumption"
    | "note";
  label?: string;
  title?: string;
  children: ReactNode;
  footer?: ReactNode;
};

const toneByKind: Record<NonNullable<TheoremBlockProps["kind"]>, string> = {
  theorem:
    "border-blue-200 bg-blue-50/80 text-blue-900 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-100",
  definition:
    "border-emerald-200 bg-emerald-50/80 text-emerald-900 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-100",
  lemma:
    "border-violet-200 bg-violet-50/80 text-violet-900 dark:border-violet-500/20 dark:bg-violet-500/10 dark:text-violet-100",
  proposition:
    "border-amber-200 bg-amber-50/80 text-amber-900 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-100",
  corollary:
    "border-cyan-200 bg-cyan-50/80 text-cyan-900 dark:border-cyan-500/20 dark:bg-cyan-500/10 dark:text-cyan-100",
  assumption:
    "border-rose-200 bg-rose-50/80 text-rose-900 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-100",
  note:
    "border-slate-200 bg-slate-50/80 text-slate-900 dark:border-white/10 dark:bg-white/5 dark:text-slate-100",
};

export function TheoremBlock({
  kind = "theorem",
  label,
  title,
  children,
  footer,
}: TheoremBlockProps) {
  const kindLabel = kind.charAt(0).toUpperCase() + kind.slice(1);
  const badgeText = [kindLabel, label].filter(Boolean).join(" ");

  return (
    <section className={mdxPanelClass}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-2">
          <p className={mdxSubtleTextClass}>Formal Block</p>
          <div className="flex flex-wrap items-center gap-3">
            <span
              className={`rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] ${toneByKind[kind]}`}
            >
              {badgeText}
            </span>
            {title ? (
              <h3 className="text-lg font-semibold text-slate-950 dark:text-white">
                {title}
              </h3>
            ) : null}
          </div>
        </div>
      </div>

      <div
        className={`${mdxInsetClass} mt-5 border-l-4 border-slate-900/80 px-4 py-4 dark:border-white/60 sm:px-5`}
      >
        <div className="text-sm leading-7 text-slate-700 dark:text-slate-200">
          {children}
        </div>
      </div>

      {footer ? <div className={`mt-4 ${mdxMutedTextClass}`}>{footer}</div> : null}
    </section>
  );
}
