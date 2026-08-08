import { mdxMutedTextClass } from "./surface";

type DecisionBranch = {
  label: string;
  outcome: string;
  detail?: string;
  tone?: "default" | "accent" | "muted" | "success" | "caution";
};

type DecisionTreeProps = {
  title?: string;
  caption?: string;
  question: string;
  branches: DecisionBranch[];
};

const tones: Record<NonNullable<DecisionBranch["tone"]>, string> = {
  default: "border-slate-400",
  accent: "border-sky-600",
  muted: "border-slate-300 dark:border-slate-600",
  success: "border-emerald-600",
  caution: "border-amber-600",
};

export function DecisionTree({
  title,
  caption,
  question,
  branches,
}: DecisionTreeProps) {
  const usableBranches = branches.filter(branch => branch.label.trim() && branch.outcome.trim());

  return (
    <figure className="my-10">
      {title ? (
        <p className="font-semibold text-slate-950 dark:text-white">{title}</p>
      ) : null}
      <div className="mt-5 border-y border-slate-200/80 py-6 dark:border-white/10">
        <div className="mx-auto max-w-3xl">
          <div className="border-l-[3px] border-sky-600 pl-4 dark:border-sky-400">
            <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-sky-700 dark:text-sky-400">
              Decision
            </p>
            <p className="mt-2 text-lg font-semibold leading-7 text-slate-950 dark:text-white">
              {question}
            </p>
          </div>
          <ol className="mt-8 grid gap-6 md:grid-cols-2">
            {usableBranches.map((branch, index) => (
              <li
                key={`${branch.label}-${index}`}
                className={`border-t-2 pt-4 ${tones[branch.tone ?? "default"]}`}
              >
                <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                  If {branch.label}
                </p>
                <p className="mt-2 text-base font-semibold leading-6 text-slate-950 dark:text-white">
                  {branch.outcome}
                </p>
                {branch.detail ? (
                  <p className={`mt-2 text-sm ${mdxMutedTextClass}`}>{branch.detail}</p>
                ) : null}
              </li>
            ))}
          </ol>
        </div>
      </div>
      {caption ? (
        <figcaption className={`mt-4 ${mdxMutedTextClass}`}>{caption}</figcaption>
      ) : null}
    </figure>
  );
}
