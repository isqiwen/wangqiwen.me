import type { ReactNode } from "react";

export function PullQuote({ children, author }: { children: ReactNode; author?: string }) {
  return (
    <figure className="my-10 border-y border-slate-200/80 py-8 text-center dark:border-white/10">
      <blockquote className="mx-auto max-w-3xl text-xl font-medium leading-relaxed text-slate-900 dark:text-white sm:text-2xl">{children}</blockquote>
      {author && (
        <figcaption className="mt-5 text-xs uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">
          — {author}
        </figcaption>
      )}
    </figure>
  );
}
