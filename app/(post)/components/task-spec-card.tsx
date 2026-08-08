import {
  mdxMutedTextClass,
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
    <section className="my-10 border-y border-slate-200/80 py-5 dark:border-white/10">
      <p className="font-semibold text-slate-950 dark:text-white">{title}</p>
      <p className={`mt-2 ${mdxMutedTextClass}`}>
        {environment}
        {domain ? ` · ${domain}` : ""}
      </p>

      <div className="mt-5 border-l-2 border-slate-300 pl-4 dark:border-slate-600">
        <p className="text-sm font-semibold text-slate-900 dark:text-white">Goal</p>
        <p className={`mt-2 ${mdxMutedTextClass}`}>{goal}</p>
      </div>

      <div className="mt-5 grid divide-y divide-slate-200/80 border-y border-slate-200/80 dark:divide-white/10 dark:border-white/10 lg:grid-cols-2 lg:divide-x lg:divide-y-0">
        <SpecList title="Observations" items={observations} />
        <SpecList title="Actions" items={actions} />
        {rewards.length ? <SpecList title="Rewards" items={rewards} /> : null}
        {successCriteria.length ? (
          <SpecList title="Success criteria" items={successCriteria} />
        ) : null}
      </div>

      {notes ? <p className={`mt-5 ${mdxMutedTextClass}`}>{notes}</p> : null}
    </section>
  );
}

function SpecList({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="px-4 py-4 first:pl-0 last:pb-0 lg:first:pb-4 lg:last:pr-0 lg:last:pb-4">
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
