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
    <div className="my-4 grid gap-3 rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur md:grid-cols-2">
      {children}
    </div>
  );
}

export function KeyValueItem({ label, value }: KeyValueItemProps) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-[0_10px_30px_rgba(2,6,23,0.2)]">
      <p className="text-xs uppercase tracking-[0.3em] text-slate-500">{label}</p>
      <p className="mt-2 text-base text-slate-800">{value}</p>
    </div>
  );
}
