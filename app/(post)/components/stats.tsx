import type { ReactNode } from "react";

export function Stats({ children }: { children: ReactNode }) {
  return (
    <div className="my-8 grid gap-4 rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur sm:grid-cols-2">
      {children}
    </div>
  );
}

export function Stat({ value, label, trend }: { value: string; label: string; trend?: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-[0_10px_30px_rgba(2,6,23,0.35)]">
      <p className="text-xs uppercase tracking-[0.3em] text-slate-400">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-white">{value}</p>
      {trend && <p className="mt-1 text-xs text-emerald-300">{trend}</p>}
    </div>
  );
}
