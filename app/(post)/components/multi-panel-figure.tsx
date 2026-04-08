import type { ReactNode } from "react";
import { RawImage } from "./raw-image";
import {
  mdxEmptyStateClass,
  mdxInsetClass,
  mdxMutedTextClass,
  mdxPanelClass,
  mdxSubtleTextClass,
} from "./surface";

export type MultiPanelFigurePanel = {
  id?: string;
  label?: string;
  title?: string;
  src: string;
  alt: string;
  note?: ReactNode;
  aspect?: "square" | "video" | "auto";
  tone?: "default" | "muted" | "dark" | "accent";
};

type MultiPanelFigureProps = {
  title?: string;
  caption?: string;
  columns?: 2 | 3 | 4;
  panels: MultiPanelFigurePanel[];
  footer?: ReactNode;
};

const columnsClassName: Record<NonNullable<MultiPanelFigureProps["columns"]>, string> = {
  2: "md:grid-cols-2",
  3: "md:grid-cols-2 xl:grid-cols-3",
  4: "md:grid-cols-2 xl:grid-cols-4",
};

const aspectClassName: Record<
  NonNullable<MultiPanelFigurePanel["aspect"]>,
  string
> = {
  square: "aspect-square",
  video: "aspect-video",
  auto: "min-h-[14rem]",
};

const toneClassName: Record<NonNullable<MultiPanelFigurePanel["tone"]>, string> = {
  default:
    "border-slate-200/80 bg-white dark:border-white/10 dark:bg-slate-950/50",
  muted:
    "border-slate-200/80 bg-slate-50 dark:border-white/10 dark:bg-white/5",
  dark: "border-slate-900/90 bg-slate-950 text-white dark:border-white/15",
  accent:
    "border-sky-200/80 bg-sky-50 dark:border-sky-400/20 dark:bg-sky-500/10",
};

export function MultiPanelFigure({
  title,
  caption,
  columns = 2,
  panels,
  footer,
}: MultiPanelFigureProps) {
  if (!panels.length) {
    return (
      <div className={mdxEmptyStateClass}>
        Add at least one image panel to render the multi-panel figure.
      </div>
    );
  }

  return (
    <section className={mdxPanelClass}>
      {(title || caption) ? (
        <div className="space-y-2">
          {title ? <p className={mdxSubtleTextClass}>Multi-Panel Figure</p> : null}
          {title ? (
            <h3 className="text-xl font-semibold text-slate-950 dark:text-white">
              {title}
            </h3>
          ) : null}
          {caption ? <p className={mdxMutedTextClass}>{caption}</p> : null}
        </div>
      ) : null}

      <div className={`mt-5 grid gap-4 ${columnsClassName[columns]}`}>
        {panels.map((panel, index) => {
          const aspect = panel.aspect ?? "square";
          const tone = panel.tone ?? "muted";
          const label = panel.label?.trim() || String.fromCharCode(65 + index);

          return (
            <figure
              key={panel.id ?? `${label}-${index}`}
              className={`${mdxInsetClass} overflow-hidden p-3`}
            >
              <div
                className={`overflow-hidden rounded-[1.5rem] border ${toneClassName[tone]}`}
              >
                <div className="flex items-center justify-between gap-3 border-b border-black/5 px-4 py-3 dark:border-white/10">
                  <div className="flex items-center gap-3">
                    <span className="rounded-full border border-current/10 bg-white/80 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-600 dark:bg-white/10 dark:text-slate-200">
                      {label}
                    </span>
                    {panel.title ? (
                      <div className="text-sm font-semibold text-slate-900 dark:text-white">
                        {panel.title}
                      </div>
                    ) : null}
                  </div>
                </div>

                <div className={`${aspectClassName[aspect]} px-4 py-4`}>
                  <div className="flex h-full items-center justify-center overflow-hidden rounded-2xl bg-black/5 p-4 dark:bg-black/20">
                    <RawImage
                      src={panel.src}
                      alt={panel.alt}
                      className="h-full w-full object-contain"
                    />
                  </div>
                </div>
              </div>

              {panel.note ? (
                <figcaption className={`mt-3 px-1 ${mdxMutedTextClass}`}>
                  {panel.note}
                </figcaption>
              ) : null}
            </figure>
          );
        })}
      </div>

      {footer ? <div className={`mt-4 ${mdxMutedTextClass}`}>{footer}</div> : null}
    </section>
  );
}
