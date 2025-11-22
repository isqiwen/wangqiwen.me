import type { ReactNode } from "react";

type AccordionItemProps = {
  title: string;
  children: ReactNode;
  open?: boolean;
};

type AccordionProps = {
  children: ReactNode;
};

export function Accordion({ children }: AccordionProps) {
  return <div className="my-4 divide-y divide-white/10 rounded-3xl border border-white/10 bg-white/5">{children}</div>;
}

export function AccordionItem({ title, children, open = false }: AccordionItemProps) {
  return (
    <details
      className="group px-4 py-3"
      {...(open ? { open: true } : {})}
    >
      <summary className="flex cursor-pointer items-center justify-between text-sm font-semibold text-slate-900">
        <span>{title}</span>
        <span className="text-xs text-slate-500 group-open:rotate-45 transition-transform">+</span>
      </summary>
      <div className="mt-2 text-sm leading-relaxed text-slate-700">{children}</div>
    </details>
  );
}
