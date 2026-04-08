// Shared surface styles keep interactive MDX components visually consistent
// across light and dark themes without repeating long utility strings.
export const mdxPanelClass =
  "my-6 rounded-3xl border border-slate-200/70 bg-white/95 p-4 shadow-[0_20px_60px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-slate-950/40";

export const mdxInsetClass =
  "rounded-2xl border border-slate-200/70 bg-slate-50/80 dark:border-white/10 dark:bg-white/5";

export const mdxMutedTextClass =
  "text-sm leading-relaxed text-slate-600 dark:text-slate-300";

export const mdxSubtleTextClass =
  "text-xs uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400";

export const mdxEmptyStateClass =
  "rounded-2xl border border-dashed border-slate-300/80 bg-slate-50/80 px-4 py-6 text-sm text-slate-500 dark:border-white/15 dark:bg-white/5 dark:text-slate-400";

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
