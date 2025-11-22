import type { ReactNode } from "react";

type StatGridProps = {
  children: ReactNode;
};

type KPIProps = {
  label: string;
  value: string;
  delta?: string;
  spark?: number[];
};

export function StatGrid({ children }: StatGridProps) {
  return (
    <div className="my-4 grid gap-4 rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur sm:grid-cols-2 lg:grid-cols-3">
      {children}
    </div>
  );
}

export function KPI({ label, value, delta, spark = [] }: KPIProps) {
  const max = Math.max(...spark, 1);
  const points = spark
    .map((v, i) => {
      const x = (i / Math.max(spark.length - 1, 1)) * 100;
      const y = 100 - (v / max) * 100;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-[0_10px_30px_rgba(2,6,23,0.2)]">
      <p className="text-xs uppercase tracking-[0.3em] text-slate-500">{label}</p>
      <div className="mt-2 flex items-baseline justify-between">
        <p className="text-3xl font-semibold text-slate-900">{value}</p>
        {delta ? <span className="text-xs text-emerald-500">{delta}</span> : null}
      </div>
      {spark.length > 1 ? (
        <svg viewBox="0 0 100 100" className="mt-3 h-10 w-full text-blue-500" preserveAspectRatio="none">
          <polyline
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={points}
          />
        </svg>
      ) : null}
    </div>
  );
}
