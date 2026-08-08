import type { ReactNode } from "react";

type ProofBlockProps = {
  title?: string;
  strategy?: string;
  children: ReactNode;
  conclusion?: ReactNode;
};

export function ProofBlock({
  title = "Proof sketch",
  strategy,
  children,
  conclusion,
}: ProofBlockProps) {
  return (
    <section className="my-8 pl-5 scroll-mt-24 sm:pl-6">
      <p className="text-base leading-8 text-slate-900 dark:text-white">
        <span className="font-semibold">Proof.</span>{" "}
        {title !== "Proof sketch" ? <span className="italic">{title}.</span> : null}
        {strategy ? <span className="text-slate-500 dark:text-slate-400"> ({strategy})</span> : null}
      </p>

      <div className="mt-3 text-base leading-8 text-slate-700 dark:text-slate-200">
        {children}
      </div>

      {conclusion ? (
        <p className="mt-3 text-base leading-8 text-slate-700 dark:text-slate-200">
          <span className="font-semibold">Therefore.</span>{" "}
          {conclusion} <span aria-label="end of proof">∎</span>
        </p>
      ) : (
        <span
          className="mt-3 block text-right text-slate-700 dark:text-slate-200"
          aria-label="end of proof"
        >
          ∎
        </span>
      )}
    </section>
  );
}
