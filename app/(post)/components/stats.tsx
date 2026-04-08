import type { ReactNode } from "react";
import { mdxInsetClass, mdxPanelClass, mdxSubtleTextClass } from "./surface";

export function Stats({ children }: { children: ReactNode }) {
  return (
    <div className={`${mdxPanelClass} grid gap-4 backdrop-blur sm:grid-cols-2`}>
      {children}
    </div>
  );
}

export function Stat({ value, label, trend }: { value: string; label: string; trend?: string }) {
  return (
    <div className={`${mdxInsetClass} p-4 shadow-sm`}>
      <p className={mdxSubtleTextClass}>{label}</p>
      <p className="mt-2 text-3xl font-semibold text-slate-900 dark:text-white">{value}</p>
      {trend && <p className="mt-1 text-xs text-emerald-600 dark:text-emerald-300">{trend}</p>}
    </div>
  );
}
