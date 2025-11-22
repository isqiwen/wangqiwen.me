"use client";

import { useRef, useState } from "react";
import type { ReactNode } from "react";

type Chapter = { label: string; time: number };
type Danmaku = { time: number; text: string };

type VideoPlayerProps = {
  src: string;
  poster?: string;
  title?: string;
  chapters?: Chapter[];
  danmaku?: Danmaku[];
  children?: ReactNode;
};

export function VideoPlayer({ src, poster, title, chapters = [], danmaku = [], children }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [now, setNow] = useState(0);

  const handleChapterClick = (time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      videoRef.current.play();
    }
  };

  const activeDanmaku = [...danmaku]
    .filter(item => item.time <= now)
    .sort((a, b) => b.time - a.time)[0];

  return (
    <div className="my-4 overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-[0_20px_80px_rgba(15,23,42,0.12)]">
      {title && <div className="px-4 pt-4 text-sm font-semibold text-slate-900">{title}</div>}
      <div className="relative px-4 pb-4">
        <video
          ref={videoRef}
          className="mt-2 w-full overflow-hidden rounded-2xl border border-white/10 bg-black"
          src={src}
          poster={poster}
          controls
          onTimeUpdate={e => setNow(e.currentTarget.currentTime)}
        />
        {activeDanmaku && (
          <div className="pointer-events-none absolute bottom-6 left-1/2 w-[80%] max-w-2xl -translate-x-1/2 rounded-full bg-black/60 px-4 py-2 text-center text-sm text-white shadow-lg backdrop-blur">
            {activeDanmaku.text}
          </div>
        )}
      </div>
      {(chapters.length > 0 || children) && (
        <div className="flex flex-col gap-2 border-t border-white/10 bg-white/2 px-4 py-3 text-sm text-slate-700">
          {chapters.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {chapters.map((item, index) => (
                <button
                  key={index}
                  onClick={() => handleChapterClick(item.time)}
                  className="rounded-full border border-white/20 bg-white/40 px-3 py-1 text-xs font-semibold text-slate-800 shadow-sm transition hover:border-blue-400 hover:text-blue-600"
                >
                  {item.label}
                </button>
              ))}
            </div>
          )}
          {children ? <div className="text-xs text-slate-500">{children}</div> : null}
        </div>
      )}
    </div>
  );
}
