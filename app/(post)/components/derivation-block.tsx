import { renderMathMarkup } from "./math";
import {
  mdxInsetClass,
  mdxMutedTextClass,
  mdxPanelClass,
  mdxSubtleTextClass,
} from "./surface";

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
    <section className={mdxPanelClass}>
      <div className="space-y-2">
        <p className={mdxSubtleTextClass}>Derivation</p>
        <h3 className="text-lg font-semibold text-slate-950 dark:text-white">
          {title}
        </h3>
        {caption ? <p className={mdxMutedTextClass}>{caption}</p> : null}
      </div>

      <div className="mt-5 space-y-4">
        {steps.map((step, index) => (
          <div key={`${step.label ?? step.title ?? "step"}-${index}`} className={`${mdxInsetClass} px-4 py-4 sm:px-5`}>
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-full bg-slate-900 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-white dark:bg-white dark:text-slate-950">
                {step.label || `Step ${index + 1}`}
              </span>
              {step.title ? (
                <div className="text-sm font-semibold text-slate-900 dark:text-white">
                  {step.title}
                </div>
              ) : null}
            </div>

            {step.equation ? (
              <div
                className="mdx-math-block mt-4 text-slate-950 dark:text-white"
                dangerouslySetInnerHTML={{ __html: renderMathMarkup(step.equation, true) }}
              />
            ) : null}

            {step.note ? (
              <p className={`mt-4 ${mdxMutedTextClass}`}>{step.note}</p>
            ) : null}
          </div>
        ))}
      </div>
    </section>
  );
}
