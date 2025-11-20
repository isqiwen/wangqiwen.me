import type { ReactNode } from "react";
import { Children } from "react";

export function Steps({
  title,
  children,
}: {
  title?: string;
  children: ReactNode;
}) {
  const items = Children.toArray(children);

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_20px_80px_rgba(15,23,42,0.08)]">
      {title && (
        <p className="text-xs uppercase tracking-[0.3em] text-slate-500">{title}</p>
      )}
      <ol className="mt-4 space-y-6">
        {items.map((child, index) => (
          <li key={index} className="flex items-start gap-4">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-b from-indigo-500 to-blue-500 text-sm font-semibold text-white shadow-[0_10px_30px_rgba(79,118,255,0.35)]">
              {String(index + 1).padStart(2, "0")}
            </span>
            <div className="flex-1 text-sm text-slate-700">{child}</div>
          </li>
        ))}
      </ol>
    </div>
  );
}

export function Step({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <p className="font-semibold text-slate-900">{title}</p>
      <div className="mt-2 text-base text-slate-600">{children}</div>
    </div>
  );
}
