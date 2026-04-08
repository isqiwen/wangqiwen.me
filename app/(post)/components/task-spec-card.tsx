import {
  mdxInsetClass,
  mdxMutedTextClass,
  mdxPanelClass,
  mdxSubtleTextClass,
} from "./surface";

type TaskSpecCardProps = {
  title: string;
  domain?: string;
  environment: string;
  goal: string;
  observations: string[];
  actions: string[];
  rewards?: string[];
  successCriteria?: string[];
  notes?: string;
};

export function TaskSpecCard({
  title,
  domain,
  environment,
  goal,
  observations,
  actions,
  rewards = [],
  successCriteria = [],
  notes,
}: TaskSpecCardProps) {
  return (
    <section className={mdxPanelClass}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-2">
          <p className={mdxSubtleTextClass}>Task Spec</p>
          <h3 className="text-xl font-semibold text-slate-950 dark:text-white">
            {title}
          </h3>
          <p className={mdxMutedTextClass}>
            {environment}
            {domain ? ` · ${domain}` : ""}
          </p>
        </div>
      </div>

      <div className={`${mdxInsetClass} mt-5 px-4 py-4 sm:px-5`}>
        <p className="text-sm font-semibold text-slate-900 dark:text-white">Goal</p>
        <p className={`mt-2 ${mdxMutedTextClass}`}>{goal}</p>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <SpecList title="Observations" items={observations} />
        <SpecList title="Actions" items={actions} />
        {rewards.length ? <SpecList title="Rewards" items={rewards} /> : null}
        {successCriteria.length ? (
          <SpecList title="Success criteria" items={successCriteria} />
        ) : null}
      </div>

      {notes ? <p className={`mt-4 ${mdxMutedTextClass}`}>{notes}</p> : null}
    </section>
  );
}

function SpecList({ title, items }: { title: string; items: string[] }) {
  return (
    <div className={`${mdxInsetClass} px-4 py-4 sm:px-5`}>
      <p className="text-sm font-semibold text-slate-900 dark:text-white">{title}</p>
      <ul className="mt-3 space-y-2 text-sm text-slate-700 dark:text-slate-200">
        {items.map(item => (
          <li key={`${title}-${item}`} className="leading-7">
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
