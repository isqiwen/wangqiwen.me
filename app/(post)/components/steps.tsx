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
    <div className="my-8 border-y border-slate-200/80 py-6 dark:border-white/10">
      {title && <p className="font-semibold text-slate-900 dark:text-white">{title}</p>}
      <ol className="mt-5 space-y-6 pl-[1.8125rem]">
        {items.map((child, index) => (
          <li key={index} className="relative">
            {index < items.length - 1 ? (
              <span
                aria-hidden="true"
                className="absolute left-[-1.78125rem] top-2.5 bottom-[-2.125rem] w-px -translate-x-1/2 bg-slate-200/80 dark:bg-white/10"
              />
            ) : null}
            <span
              aria-hidden="true"
              className="absolute -left-[2.28125rem] top-0.5 z-10 flex h-4 w-4 items-center justify-center rounded-full border-2 border-white bg-slate-800 font-mono text-[8px] font-semibold text-white dark:border-slate-950 dark:bg-slate-200 dark:text-slate-950"
            >
              {index + 1}
            </span>
            <div className="text-sm text-slate-700 dark:text-slate-200">{child}</div>
          </li>
        ))}
      </ol>
    </div>
  );
}

export function Step({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <p className="font-semibold text-slate-900 dark:text-white">{title}</p>
      <div className="mt-2 text-base leading-7 text-slate-600 dark:text-slate-300">{children}</div>
    </div>
  );
}
