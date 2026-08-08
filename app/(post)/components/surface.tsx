// Shared surface styles keep MDX components restrained and readable. Article
// content uses rules and spacing as its primary structure; controls and media
// may add their own stronger treatment when interaction requires it.
export const mdxPanelClass =
  "my-8 border-y border-slate-200/80 py-6 dark:border-white/10";

export const mdxInsetClass =
  "rounded-lg border border-slate-200/70 bg-slate-50/60 dark:border-white/10 dark:bg-white/5";

export const mdxDataTableFrameClass =
  "mt-5 overflow-x-auto border-y border-slate-200/80 dark:border-white/10";

export const mdxDataTableHeadClass =
  "border-b border-slate-300/80 text-sm text-slate-600 dark:border-white/15 dark:text-slate-300";

export const mdxMutedTextClass =
  "text-sm leading-relaxed text-slate-600 dark:text-slate-300";

export const mdxSubtleTextClass =
  "text-xs uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400";

export const mdxEmptyStateClass =
  "border border-dashed border-slate-300/80 bg-slate-50/80 px-4 py-6 text-sm text-slate-500 dark:border-white/15 dark:bg-white/5 dark:text-slate-400";

export function mdxPillButtonClass(active: boolean) {
  return `rounded-full px-4 py-1.5 text-xs font-semibold tracking-[0.18em] transition ${
    active
      ? "bg-slate-900 text-white shadow-sm dark:bg-white dark:text-slate-950"
      : "border border-slate-300/80 text-slate-600 hover:border-slate-400 hover:text-slate-900 dark:border-white/15 dark:text-slate-300 dark:hover:border-white/30 dark:hover:text-white"
  }`;
}

export function clampCount(value: number, min: number, max: number) {
  if (!Number.isFinite(value)) {
    return min;
  }

  return Math.min(max, Math.max(min, Math.round(value)));
}
