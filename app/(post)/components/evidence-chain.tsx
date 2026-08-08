import { mdxMutedTextClass } from "./surface";

type EvidenceChainItem = {
  stage: string;
  title: string;
  detail?: string;
  tone?: "default" | "accent" | "muted" | "success" | "caution";
};

type EvidenceChainProps = {
  title?: string;
  caption?: string;
  items: EvidenceChainItem[];
};

const tones: Record<NonNullable<EvidenceChainItem["tone"]>, string> = {
  default: "bg-slate-500",
  accent: "bg-sky-600",
  muted: "bg-slate-300 dark:bg-slate-600",
  success: "bg-emerald-600",
  caution: "bg-amber-600",
};

export function EvidenceChain({ title, caption, items }: EvidenceChainProps) {
  const usableItems = items.filter(item => item.stage.trim() && item.title.trim());

  return (
    <figure className="my-10">
      {title ? (
        <p className="font-semibold text-slate-950 dark:text-white">{title}</p>
      ) : null}
      <div className="mt-5 border-y border-slate-200/80 py-6 dark:border-white/10">
        <ol className="grid gap-y-7 md:grid-flow-col md:auto-cols-fr md:gap-x-7">
          {usableItems.map((item, index) => {
            const isLast = index === usableItems.length - 1;
            return (
            <li
              key={`${item.stage}-${item.title}`}
              className="relative pl-6 pt-1 md:pl-0 md:pt-5"
            >
                <span
                  aria-hidden="true"
                  className={`absolute left-0 top-1.5 z-10 h-2.5 w-2.5 rounded-full md:top-0 ${tones[item.tone ?? "default"]}`}
                />
                {!isLast ? (
                  <span
                    aria-hidden="true"
                    className="absolute bottom-[-1.75rem] left-[0.28rem] top-4 w-px bg-slate-300 dark:bg-slate-600 md:bottom-auto md:left-2.5 md:top-[0.28rem] md:h-px md:w-[calc(100%+1.72rem)]"
                  />
                ) : null}
                <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                  {String(index + 1).padStart(2, "0")} · {item.stage}
                </p>
                <p className="mt-2 text-base font-semibold leading-6 text-slate-950 dark:text-white">
                  {item.title}
                </p>
                {item.detail ? (
                  <p className={`mt-2 text-sm ${mdxMutedTextClass}`}>{item.detail}</p>
                ) : null}
              </li>
            );
          })}
        </ol>
      </div>
      {caption ? (
        <figcaption className={`mt-4 ${mdxMutedTextClass}`}>{caption}</figcaption>
      ) : null}
    </figure>
  );
}
