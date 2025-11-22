import type { ReactNode } from "react";

type CompareProps = {
  leftTitle: string;
  rightTitle: string;
  left: ReactNode;
  right: ReactNode;
};

export function Compare({ leftTitle, rightTitle, left, right }: CompareProps) {
  return (
    <div className="my-4 grid gap-4 rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur md:grid-cols-2">
      <div className="space-y-3 rounded-2xl border border-white/10 bg-slate-900/80 p-4 text-sm text-slate-100 shadow-[0_20px_60px_rgba(15,23,42,0.28)]">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-400">{leftTitle}</p>
        <div className="text-base leading-relaxed text-slate-100">{left}</div>
      </div>
      <div className="space-y-3 rounded-2xl border border-white/10 bg-slate-900/80 p-4 text-sm text-slate-100 shadow-[0_20px_60px_rgba(15,23,42,0.28)]">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-400">{rightTitle}</p>
        <div className="text-base leading-relaxed text-slate-100">{right}</div>
      </div>
    </div>
  );
}
