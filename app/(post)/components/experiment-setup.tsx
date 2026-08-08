import {
  mdxMutedTextClass,
} from "./surface";

type ExperimentSetting = {
  label: string;
  value: string;
};

type ExperimentSetupProps = {
  title?: string;
  dataset?: string;
  split?: string;
  metrics?: string[];
  compute?: string;
  notes?: string;
  settings?: ExperimentSetting[];
};

export function ExperimentSetup({
  title = "Experiment setup",
  dataset,
  split,
  metrics = [],
  compute,
  notes,
  settings = [],
}: ExperimentSetupProps) {
  return (
    <section className="my-10 border-y border-slate-200/80 py-5 dark:border-white/10">
      <p className="font-semibold text-slate-950 dark:text-white">{title}</p>

      <dl className="mt-5 grid divide-y divide-slate-200/80 border-y border-slate-200/80 dark:divide-white/10 dark:border-white/10 lg:grid-cols-2 lg:divide-x lg:divide-y-0">
        <SetupItem title="Dataset" body={dataset} />
        <SetupItem title="Split" body={split} />
        <SetupItem title="Compute" body={compute} />
        <SetupItem title="Metrics" body={metrics.length ? metrics.join(", ") : undefined} />
      </dl>

      {settings.length ? (
        <dl className="mt-5 grid divide-y divide-slate-200/80 dark:divide-white/10 md:grid-cols-2 md:divide-x md:divide-y-0">
          {settings.map(setting => (
            <div
              key={`${setting.label}-${setting.value}`}
              className="px-4 py-3 first:pl-0 last:pb-0 md:first:pb-3 md:last:pr-0 md:last:pb-3"
            >
              <dt className="text-sm font-semibold text-slate-900 dark:text-white">{setting.label}</dt>
              <dd className={`mt-1 ${mdxMutedTextClass}`}>{setting.value}</dd>
            </div>
          ))}
        </dl>
      ) : null}

      {notes ? <p className={`mt-5 ${mdxMutedTextClass}`}>{notes}</p> : null}
    </section>
  );
}

function SetupItem({ title, body }: { title: string; body?: string }) {
  if (!body) {
    return null;
  }

  return (
    <div className="px-4 py-4 first:pl-0 last:pb-0 lg:first:pb-4 lg:last:pr-0 lg:last:pb-4">
      <dt className="text-sm font-semibold text-slate-900 dark:text-white">{title}</dt>
      <dd className={`mt-1 ${mdxMutedTextClass}`}>{body}</dd>
    </div>
  );
}
