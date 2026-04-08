import type { ReactNode } from "react";

export function PullQuote({ children, author }: { children: ReactNode; author?: string }) {
  return (
    <figure className="my-8 rounded-3xl border border-slate-200 bg-white p-6 text-center text-base font-medium text-slate-900 shadow-[0_30px_60px_rgba(15,18,40,0.1)]">
      <blockquote className="text-lg leading-relaxed text-slate-800">{children}</blockquote>
      {author && (
        <figcaption className="mt-3 text-right text-xs uppercase tracking-[0.3em] text-slate-500">
          - {author}
        </figcaption>
      )}
    </figure>
  );
}
