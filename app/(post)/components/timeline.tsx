import { Children } from "react";
import type { ReactNode } from "react";
import { mdxInsetClass, mdxMutedTextClass, mdxPanelClass } from "./surface";

type TimelineProps = {
  children: ReactNode;
};

type TimelineItemProps = {
  title: string;
  time: string;
  children: ReactNode;
};

export function Timeline({ children }: TimelineProps) {
  const items = Children.toArray(children);
  return (
    <ol className={`${mdxPanelClass} space-y-6 border-l border-slate-200 pl-6 dark:border-white/10`}>
      {items.map((child, index) => (
        <li key={index} className="relative">
          <span className="absolute -left-3 top-1.5 inline-flex h-3 w-3 items-center justify-center rounded-full bg-gradient-to-b from-indigo-500 to-blue-500 shadow-[0_8px_20px_rgba(79,118,255,0.35)]" />
          {child}
        </li>
      ))}
    </ol>
  );
}

export function TimelineItem({ title, time, children }: TimelineItemProps) {
  return (
    <div className={`${mdxInsetClass} p-4 backdrop-blur`}>
      <div className="flex items-center justify-between gap-3 text-sm text-slate-500 dark:text-slate-400">
        <span className="font-semibold text-slate-900 dark:text-white">{title}</span>
        <span>{time}</span>
      </div>
      <div className={`mt-2 ${mdxMutedTextClass}`}>{children}</div>
    </div>
  );
}
