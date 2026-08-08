import type { ReactNode } from "react";

type KeyValueListProps = {
  children: ReactNode;
};

type KeyValueItemProps = {
  label: string;
  value: ReactNode;
};

export function KeyValueList({ children }: KeyValueListProps) {
  return (
    <dl className="my-10 grid divide-y divide-slate-200/80 border-y border-slate-200/80 dark:divide-white/10 dark:border-white/10 md:grid-cols-2 md:divide-x md:divide-y-0">
      {children}
    </dl>
  );
}

export function KeyValueItem({ label, value }: KeyValueItemProps) {
  return (
    <div className="px-4 py-4 first:pl-0 last:pb-0 sm:first:pb-4 sm:last:pr-0 sm:last:pb-4">
      <dt className="text-sm font-semibold text-slate-900 dark:text-white">{label}</dt>
      <dd className="mt-1 text-base leading-7 text-slate-700 dark:text-slate-200">{value}</dd>
    </div>
  );
}
