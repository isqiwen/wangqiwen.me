import type { ReactNode } from "react";

export function Stats({ children }: { children: ReactNode }) {
  return (
    <dl className="my-10 grid border-y border-slate-200/80 divide-y divide-slate-200/80 dark:border-white/10 dark:divide-white/10 sm:grid-cols-2 sm:divide-x sm:divide-y-0">
      {children}
    </dl>
  );
}

export function Stat({ value, label, trend }: { value: string; label: string; trend?: string }) {
  return (
    <div className="px-4 py-4 first:pl-0 last:pb-0 sm:first:pb-4 sm:last:pr-0 sm:last:pb-4">
      <dt className="text-sm text-slate-600 dark:text-slate-300">{label}</dt>
      <dd className="mt-1 text-xl font-semibold tabular-nums text-slate-900 dark:text-white">{value}</dd>
      {trend && <dd className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">{trend}</dd>}
    </div>
  );
}
