import type { ReactNode } from "react";
import { renderMathMarkup } from "./math";
import {
  mdxInsetClass,
  mdxMutedTextClass,
  mdxPanelClass,
  mdxSubtleTextClass,
} from "./surface";

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
    <section className={mdxPanelClass}>
      <div className="space-y-2">
        <p className={mdxSubtleTextClass}>Equation Group</p>
        <h3 className="text-lg font-semibold text-slate-950 dark:text-white">
          {title}
        </h3>
        {caption ? <p className={mdxMutedTextClass}>{caption}</p> : null}
      </div>

      <div className="mt-5 space-y-4">
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
              className={`${mdxInsetClass} scroll-mt-24 px-4 py-4 sm:px-5`}
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0 flex-1">
                  {equation.title ? (
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">
                      {equation.title}
                    </p>
                  ) : null}
                  <div
                    className="mdx-math-block mt-3 text-slate-950 dark:text-white"
                    dangerouslySetInnerHTML={{ __html: renderMathMarkup(equation.tex, true) }}
                  />
                  {equation.note ? (
                    <div className={`mt-4 ${mdxMutedTextClass}`}>{equation.note}</div>
                  ) : null}
                </div>

                <div
                  data-equation-label-slot
                  className={`${mdxSubtleTextClass} shrink-0 whitespace-nowrap px-1`}
                >
                  {label}
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
