import type { ReactNode } from "react";
import { RawImage } from "./raw-image";
import {
  mdxEmptyStateClass,
  mdxMutedTextClass,
} from "./surface";

type KSpaceViewerPanel = {
  id?: string;
  label: string;
  src: string;
  alt: string;
  note?: ReactNode;
  kind?: "kspace" | "mask" | "reconstruction" | "error" | "reference";
};

type KSpaceViewerProps = {
  title?: string;
  caption?: string;
  panels: KSpaceViewerPanel[];
  columns?: 2 | 4;
};

const columnsClassName: Record<NonNullable<KSpaceViewerProps["columns"]>, string> = {
  2: "md:grid-cols-2",
  4: "md:grid-cols-2 xl:grid-cols-4",
};

export function KSpaceViewer({
  title,
  caption,
  panels,
  columns = 2,
}: KSpaceViewerProps) {
  if (!panels.length) {
    return (
      <div className={mdxEmptyStateClass}>
        Add k-space panels to render the MRI viewer.
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
          const kind = panel.kind ?? "image";

          return (
            <figure
              key={panel.id ?? `${panel.label}-${index}`}
              className="min-w-0"
            >
              <figcaption className="mb-2 flex items-baseline justify-between gap-3 text-sm leading-6">
                <span className="font-semibold text-slate-900 dark:text-white">{panel.label}</span>
                <span className="font-mono text-xs text-slate-500 dark:text-slate-400">{kind}</span>
              </figcaption>

              <div className="aspect-square border border-slate-200/80 bg-slate-950 p-4 dark:border-white/10">
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
    </section>
  );
}
