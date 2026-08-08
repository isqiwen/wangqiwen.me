import type { ReactNode } from "react";
import { renderMathMarkup } from "./math";
import { mdxMutedTextClass } from "./surface";

type EquationEntry = {
  id: string;
  tex: string;
  title?: string;
  note?: ReactNode;
};

type EquationGroupProps = {
  title?: string;
  caption?: string;
  equations: EquationEntry[];
  startAt?: number;
  numbering?: "global" | "group";
};

export function EquationGroup({
  title = "Equation group",
  caption,
  equations,
  startAt = 1,
  numbering = "global",
}: EquationGroupProps) {
  return (
    <section className="my-10 border-y border-slate-200 py-6 dark:border-white/10">
      <div>
        <p className="text-base font-semibold text-slate-900 dark:text-white">{title}</p>
        {caption ? <p className={`mt-2 ${mdxMutedTextClass}`}>{caption}</p> : null}
      </div>

      <div className="mt-4">
        {equations.map((equation, index) => {
          const number = startAt + index;
          const label = numbering === "group" ? `(${number})` : "";

          return (
            <article
              key={equation.id}
              id={equation.id}
              data-equation-id={equation.id}
              data-equation-numbering={numbering === "group" ? "manual" : "global"}
              data-equation-label={label || undefined}
              data-equation-number={numbering === "group" ? String(number) : undefined}
              className={`relative scroll-mt-24 py-5 pr-12 ${
                index > 0 ? "border-t border-slate-200 dark:border-white/10" : ""
              }`}
            >
              {equation.title ? (
                <p className="text-sm font-medium italic text-slate-700 dark:text-slate-200">
                  {equation.title}
                </p>
              ) : null}
              <div
                className="mdx-math-block mt-3 text-slate-950 dark:text-white"
                dangerouslySetInnerHTML={{ __html: renderMathMarkup(equation.tex, true) }}
              />
              {equation.note ? (
                <div className={`mt-3 ${mdxMutedTextClass}`}>{equation.note}</div>
              ) : null}

              <span
                data-equation-label-slot
                className="absolute right-0 top-1/2 -translate-y-1/2 font-mono text-sm text-slate-500 dark:text-slate-400"
              >
                {label}
              </span>
            </article>
          );
        })}
      </div>
    </section>
  );
}
