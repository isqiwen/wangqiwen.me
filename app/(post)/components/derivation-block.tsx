import { renderMathMarkup } from "./math";
import { mdxMutedTextClass } from "./surface";

type DerivationStep = {
  label?: string;
  title?: string;
  equation?: string;
  note?: string;
};

type DerivationBlockProps = {
  title?: string;
  caption?: string;
  steps: DerivationStep[];
};

export function DerivationBlock({
  title = "Derivation",
  caption,
  steps,
}: DerivationBlockProps) {
  return (
    <section className="my-10 border-y border-slate-200 py-6 dark:border-white/10">
      <div>
        <p className="text-base font-semibold text-slate-900 dark:text-white">{title}</p>
        {caption ? <p className={`mt-2 ${mdxMutedTextClass}`}>{caption}</p> : null}
      </div>

      <ol className="mt-5">
        {steps.map((step, index) => (
          <li
            key={`${step.label ?? step.title ?? "step"}-${index}`}
            className={`relative py-5 pl-6 sm:pl-7 ${
              index > 0 ? "border-t border-slate-200 dark:border-white/10" : ""
            }`}
          >
            {index < steps.length - 1 ? (
              <span
                aria-hidden="true"
                className="absolute left-0 top-[1.875rem] bottom-[-1.875rem] w-px -translate-x-1/2 bg-slate-300 dark:bg-white/20"
              />
            ) : null}
            <span
              aria-hidden="true"
              className="absolute left-0 top-6 z-10 h-3 w-3 -translate-x-1/2 rounded-full border-2 border-white bg-slate-700 dark:border-slate-950 dark:bg-slate-300"
            />
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <span className="font-mono text-xs text-slate-500 dark:text-slate-400">
                {step.label || String(index + 1).padStart(2, "0")}
              </span>
              {step.title ? (
                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                  {step.title}
                </p>
              ) : null}
            </div>

            {step.equation ? (
              <div
                className="mdx-math-block mt-3 text-slate-950 dark:text-white"
                dangerouslySetInnerHTML={{ __html: renderMathMarkup(step.equation, true) }}
              />
            ) : null}

            {step.note ? <p className={`mt-3 ${mdxMutedTextClass}`}>{step.note}</p> : null}
          </li>
        ))}
      </ol>
    </section>
  );
}
