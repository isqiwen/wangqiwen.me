import { Children } from "react";
import type { ReactNode } from "react";
import { mdxMutedTextClass } from "./surface";

type TimelineProps = {
  children: ReactNode;
};

type TimelineItemProps = {
  title: string;
  date: string;
  children: ReactNode;
};

export function Timeline({ children }: TimelineProps) {
  const items = Children.toArray(children);
  return (
    <ol className="my-8 space-y-8 border-l border-slate-200 pl-7 dark:border-white/15">
      {items.map((child, index) => (
        <li key={index} className="relative">
          <span className="absolute -left-[2.03rem] top-1.5 h-3 w-3 rounded-full border-2 border-white bg-slate-800 dark:border-slate-950 dark:bg-slate-200" />
          {child}
        </li>
      ))}
    </ol>
  );
}

export function TimelineItem({ title, date, children }: TimelineItemProps) {
  return (
    <article>
      <p className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
        {date}
      </p>
      <p className="mt-1 font-semibold text-slate-950 dark:text-white">{title}</p>
      <div className={`mt-2 ${mdxMutedTextClass}`}>{children}</div>
    </article>
  );
}
