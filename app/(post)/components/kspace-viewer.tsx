import type { ReactNode } from "react";
import { RawImage } from "./raw-image";
import {
  mdxEmptyStateClass,
  mdxInsetClass,
  mdxMutedTextClass,
  mdxPanelClass,
  mdxSubtleTextClass,
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

const kindClassName: Record<NonNullable<KSpaceViewerPanel["kind"]>, string> = {
  kspace:
    "border-sky-300/40 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.18),_rgba(2,6,23,0.98)_58%)]",
  mask:
    "border-violet-300/35 bg-[radial-gradient(circle_at_top,_rgba(167,139,250,0.18),_rgba(2,6,23,0.98)_58%)]",
  reconstruction:
    "border-emerald-300/35 bg-[radial-gradient(circle_at_top,_rgba(52,211,153,0.18),_rgba(2,6,23,0.98)_58%)]",
  error:
    "border-rose-300/35 bg-[radial-gradient(circle_at_top,_rgba(251,113,133,0.18),_rgba(2,6,23,0.98)_58%)]",
  reference:
    "border-amber-300/35 bg-[radial-gradient(circle_at_top,_rgba(251,191,36,0.16),_rgba(2,6,23,0.98)_58%)]",
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
    <section className={mdxPanelClass}>
      {(title || caption) ? (
        <div className="space-y-2">
          {title ? <p className={mdxSubtleTextClass}>MRI Viewer</p> : null}
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
          const kind = panel.kind ?? "kspace";

          return (
            <figure
              key={panel.id ?? `${panel.label}-${index}`}
              className={`${mdxInsetClass} overflow-hidden p-3`}
            >
              <div
                className={`overflow-hidden rounded-[1.75rem] border text-white shadow-[0_24px_60px_rgba(2,6,23,0.25)] ${kindClassName[kind]}`}
              >
                <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
                  <div>
                    <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/60">
                      {kind}
                    </div>
                    <div className="mt-1 text-sm font-semibold text-white">
                      {panel.label}
                    </div>
                  </div>
                </div>

                <div className="aspect-square px-4 py-4">
                  <div className="flex h-full items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-black/35 p-4">
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
    </section>
  );
}
