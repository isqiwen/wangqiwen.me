import type { ReactNode } from "react";
import { mdxInsetClass, mdxMutedTextClass, mdxPanelClass } from "./surface";

type AccordionItemProps = {
  title: string;
  children: ReactNode;
  open?: boolean;
};

type AccordionProps = {
  children: ReactNode;
};

export function Accordion({ children }: AccordionProps) {
  return (
    <div className={`${mdxPanelClass} divide-y divide-slate-200/70 p-0 dark:divide-white/10`}>
      {children}
    </div>
  );
}

export function AccordionItem({ title, children, open = false }: AccordionItemProps) {
  return (
    <details className="group px-4 py-3" {...(open ? { open: true } : {})}>
      <summary className="flex cursor-pointer items-center justify-between gap-3 text-sm font-semibold text-slate-900 dark:text-white">
        <span>{title}</span>
        <span className="text-xs text-slate-500 transition-transform group-open:rotate-45 dark:text-slate-400">
          +
        </span>
      </summary>
      <div className={`${mdxInsetClass} mt-3 p-4 ${mdxMutedTextClass}`}>{children}</div>
    </details>
  );
}
