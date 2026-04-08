"use client";

import type { ReactNode } from "react";
import { RawImage } from "./raw-image";
import { mdxInsetClass, mdxMutedTextClass, mdxPanelClass, mdxSubtleTextClass } from "./surface";

type AudioPlayerProps = {
  src: string;
  title?: string;
  subtitle?: string;
  cover?: string;
  children?: ReactNode;
};

export function AudioPlayer({ src, title, subtitle, cover, children }: AudioPlayerProps) {
  return (
    <div className={`${mdxPanelClass} flex flex-col gap-4 sm:flex-row sm:items-center`}>
      {cover ? (
        <RawImage src={cover} alt={title ?? "Audio cover"} className="h-20 w-20 rounded-2xl object-cover" />
      ) : (
        <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-slate-200/70 bg-slate-100 text-xs font-semibold uppercase tracking-[0.3em] text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-400">
          Audio
        </div>
      )}
      <div className="min-w-0 flex-1 space-y-2">
        {title ? <p className="text-base font-semibold text-slate-900 dark:text-white">{title}</p> : null}
        {subtitle ? <p className={mdxSubtleTextClass}>{subtitle}</p> : null}
        <div className={`${mdxInsetClass} p-3`}>
          <audio controls className="w-full">
            <source src={src} />
            Your browser does not support the audio element.
          </audio>
        </div>
        {children ? <div className={`[&_p]:m-0 ${mdxMutedTextClass}`}>{children}</div> : null}
      </div>
    </div>
  );
}
