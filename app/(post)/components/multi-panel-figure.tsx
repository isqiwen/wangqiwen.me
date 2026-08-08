import type { ReactNode } from "react";
import { RawImage } from "./raw-image";
import {
  mdxEmptyStateClass,
  mdxMutedTextClass,
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
  default: "bg-white dark:bg-slate-950",
  muted: "bg-slate-50 dark:bg-white/5",
  dark: "bg-slate-950 dark:bg-black",
  accent: "bg-slate-50 dark:bg-white/5",
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
    <section className="my-10">
      {(title || caption) ? (
        <div className="mb-5">
          {title ? <p className="font-semibold text-slate-950 dark:text-white">{title}</p> : null}
          {caption ? <p className={`mt-2 ${mdxMutedTextClass}`}>{caption}</p> : null}
        </div>
      ) : null}

      <div className={`grid gap-x-5 gap-y-7 ${columnsClassName[columns]}`}>
        {panels.map((panel, index) => {
          const aspect = panel.aspect ?? "square";
          const tone = panel.tone ?? "muted";
          const label = panel.label?.trim() || String.fromCharCode(65 + index);

          return (
            <figure
              key={panel.id ?? `${label}-${index}`}
              className="min-w-0"
            >
              <figcaption className="mb-2 flex gap-2 text-sm leading-6 text-slate-700 dark:text-slate-200">
                <span className="font-semibold">({label})</span>
                {panel.title ? <span>{panel.title}</span> : null}
              </figcaption>

              <div className={`${aspectClassName[aspect]} ${toneClassName[tone]} flex items-center justify-center border border-slate-200/80 p-4 dark:border-white/10`}>
                <RawImage
                  src={panel.src}
                  alt={panel.alt}
                  className="h-full w-full object-contain"
                />
              </div>

              {panel.note ? (
                <p className={`mt-3 ${mdxMutedTextClass}`}>
                  {panel.note}
                </p>
              ) : null}
            </figure>
          );
        })}
      </div>

      {footer ? <p className={`mt-5 ${mdxMutedTextClass}`}>{footer}</p> : null}
    </section>
  );
}
