import type { ReactNode } from "react";

export function Field({
  label,
  htmlFor,
  children,
  spanFull,
}: {
  label: string;
  htmlFor?: string;
  children: ReactNode;
  spanFull?: boolean;
}) {
  return (
    <div
      className={`flex flex-col gap-1 ${
        spanFull ? "md:col-span-2 lg:col-span-4" : ""
      }`}
    >
      <label htmlFor={htmlFor} className="text-xs font-semibold text-slate-600">
        {label}
      </label>
      {children}
    </div>
  );
}
