import { mdxEmptyStateClass, mdxMutedTextClass } from "./surface";

type AlgorithmStep = {
  statement: string;
  indent?: number;
  comment?: string;
};

type AlgorithmProps = {
  id?: string;
  label?: string;
  title: string;
  input?: string;
  output?: string;
  caption?: string;
  steps: AlgorithmStep[];
  emphasizedSteps?: number[];
};

function clampIndent(indent: number | undefined) {
  if (typeof indent !== "number" || !Number.isFinite(indent)) {
    return 0;
  }

  return Math.max(0, Math.min(Math.floor(indent), 8));
}

export function Algorithm({
  id,
  label,
  title,
  input,
  output,
  caption,
  steps,
  emphasizedSteps,
}: AlgorithmProps) {
  const visibleSteps = steps.filter(step => step.statement.trim());
  const prefix = ["Algorithm", label].filter(Boolean).join(" ");
  const emphasizedStepSet = new Set(
    (Array.isArray(emphasizedSteps) ? emphasizedSteps : []).filter(
      step => Number.isInteger(step) && step > 0,
    ),
  );

  if (!visibleSteps.length) {
    return (
      <div className={mdxEmptyStateClass}>
        Add at least one algorithm step to render pseudocode.
      </div>
    );
  }

  return (
    <section
      id={id}
      data-reference-kind={id ? "algorithm" : undefined}
      className="my-10 border-y border-slate-300 py-6 scroll-mt-24 dark:border-white/20"
      aria-label={title}
    >
      <div>
        <p className="text-base leading-8 text-slate-900 dark:text-white">
          <span className="font-semibold">{prefix}.</span>{" "}
          <span className="italic">{title}.</span>
        </p>
        {caption ? <p className={`mt-3 ${mdxMutedTextClass}`}>{caption}</p> : null}
      </div>

      {input || output ? (
        <dl className="mt-5 grid gap-x-5 gap-y-2 border-y border-slate-200 py-4 text-sm dark:border-white/10 sm:grid-cols-[4.75rem_minmax(0,1fr)]">
          {input ? (
            <>
              <dt className="font-semibold text-slate-900 dark:text-white">Input</dt>
              <dd className="font-mono text-slate-700 dark:text-slate-200">{input}</dd>
            </>
          ) : null}
          {output ? (
            <>
              <dt className="font-semibold text-slate-900 dark:text-white">Output</dt>
              <dd className="font-mono text-slate-700 dark:text-slate-200">{output}</dd>
            </>
          ) : null}
        </dl>
      ) : null}

      <ol className="mt-5 border-l border-slate-300 font-mono text-sm leading-7 dark:border-white/20">
        {visibleSteps.map((step, index) => {
          const emphasized = emphasizedStepSet.has(index + 1);

          return (
            <li
              key={`${step.statement}-${index}`}
              className={`relative grid grid-cols-[3rem_minmax(0,1fr)] gap-x-3 py-1 ${
                emphasized
                  ? "bg-sky-50/80 before:absolute before:inset-y-0 before:left-0 before:w-0.5 before:bg-sky-600 dark:bg-sky-400/10 dark:before:bg-sky-400"
                  : ""
              }`}
            >
              <span
                className={`select-none text-right ${
                  emphasized
                    ? "font-medium text-sky-700 dark:text-sky-300"
                    : "text-slate-400 dark:text-slate-500"
                }`}
              >
                {index + 1}
              </span>
              <div
                className="min-w-0 whitespace-pre-wrap text-slate-800 dark:text-slate-100"
                style={{ paddingInlineStart: `${clampIndent(step.indent) * 1.25}rem` }}
              >
                <span>{step.statement}</span>
                {step.comment ? (
                  <span className="ml-3 text-slate-500 dark:text-slate-400">
                    {"// "}
                    {step.comment}
                  </span>
                ) : null}
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
