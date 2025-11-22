"use client";

import { useRef } from "react";
import type { ReactNode } from "react";

type AudioPlayerProps = {
  src: string;
  title?: string;
  subtitle?: string;
  cover?: string;
  children?: ReactNode;
};

export function AudioPlayer({ src, title, subtitle, cover, children }: AudioPlayerProps) {
  const ref = useRef<HTMLAudioElement | null>(null);

  return (
    <div className="my-4 flex items-center gap-4 rounded-3xl border border-white/10 bg-white/5 p-4 shadow-[0_20px_60px_rgba(15,23,42,0.1)]">
      {cover ? <img src={cover} alt="" className="h-16 w-16 rounded-2xl object-cover" /> : null}
      <div className="flex-1 space-y-1">
        {title && <p className="text-sm font-semibold text-slate-900">{title}</p>}
        {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
        <audio ref={ref} controls className="w-full">
          <source src={src} />
          Your browser does not support the audio element.
        </audio>
        {children ? (
          <div className="text-xs text-slate-500 [&_p]:m-0 [&_p]:mt-2 first:[&_p]:mt-0">
            {children}
          </div>
        ) : null}
      </div>
    </div>
  );
}
