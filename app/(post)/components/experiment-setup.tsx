import {
  mdxInsetClass,
  mdxMutedTextClass,
  mdxPanelClass,
  mdxSubtleTextClass,
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
    <section className={mdxPanelClass}>
      <div className="space-y-2">
        <p className={mdxSubtleTextClass}>Experiment Setup</p>
        <h3 className="text-xl font-semibold text-slate-950 dark:text-white">
          {title}
        </h3>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <SetupCard title="Dataset" body={dataset} />
        <SetupCard title="Split" body={split} />
        <SetupCard title="Compute" body={compute} />
        <SetupCard title="Metrics" body={metrics.length ? metrics.join(", ") : undefined} />
      </div>

      {settings.length ? (
        <div className={`${mdxInsetClass} mt-4 overflow-x-auto px-4 py-4 sm:px-5`}>
          <p className="text-sm font-semibold text-slate-900 dark:text-white">
            Key settings
          </p>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            {settings.map(setting => (
              <div
                key={`${setting.label}-${setting.value}`}
                className="rounded-2xl border border-slate-200/70 bg-white/70 px-4 py-3 dark:border-white/10 dark:bg-white/5"
              >
                <p className="text-xs uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
                  {setting.label}
                </p>
                <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-white">
                  {setting.value}
                </p>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {notes ? <p className={`mt-4 ${mdxMutedTextClass}`}>{notes}</p> : null}
    </section>
  );
}

function SetupCard({ title, body }: { title: string; body?: string }) {
  return (
    <div className={`${mdxInsetClass} px-4 py-4 sm:px-5`}>
      <p className="text-sm font-semibold text-slate-900 dark:text-white">{title}</p>
      <p className={`mt-2 ${mdxMutedTextClass}`}>{body || "Add setup details."}</p>
    </div>
  );
}
