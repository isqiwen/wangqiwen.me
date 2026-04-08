"use client";

import { useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import {
  mdxInsetClass,
  mdxMutedTextClass,
  mdxPanelClass,
  mdxPillButtonClass,
  mdxSubtleTextClass,
} from "./surface";

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

  const activeDanmaku = useMemo(
    () =>
      [...danmaku]
        .filter(item => item.time <= now)
        .sort((a, b) => b.time - a.time)[0],
    [danmaku, now],
  );

  const activeChapterIndex = useMemo(() => {
    if (chapters.length === 0) {
      return -1;
    }

    return chapters.reduce((activeIndex, chapter, index) => {
      if (chapter.time <= now) {
        return index;
      }
      return activeIndex;
    }, -1);
  }, [chapters, now]);

  const handleChapterClick = (time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      void videoRef.current.play();
    }
  };

  return (
    <div className={`${mdxPanelClass} overflow-hidden`}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        {title ? <p className="text-base font-semibold text-slate-900 dark:text-white">{title}</p> : null}
        {chapters.length > 0 ? <span className={mdxSubtleTextClass}>{chapters.length} chapter markers</span> : null}
      </div>

      <div className="relative mt-3">
        <video
          ref={videoRef}
          className={`${mdxInsetClass} w-full overflow-hidden bg-black`}
          src={src}
          poster={poster}
          controls
          onTimeUpdate={e => setNow(e.currentTarget.currentTime)}
        />
        {activeDanmaku ? (
          <div className="pointer-events-none absolute bottom-4 left-1/2 w-[80%] max-w-2xl -translate-x-1/2 rounded-full bg-black/65 px-4 py-2 text-center text-sm text-white shadow-lg backdrop-blur">
            {activeDanmaku.text}
          </div>
        ) : null}
      </div>

      {(chapters.length > 0 || children) ? (
        <div className="mt-4 space-y-3">
          {chapters.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {chapters.map((item, index) => (
                <button
                  key={`${item.label}-${item.time}`}
                  type="button"
                  onClick={() => handleChapterClick(item.time)}
                  className={mdxPillButtonClass(index === activeChapterIndex)}
                >
                  {item.label}
                </button>
              ))}
            </div>
          ) : null}
          {children ? <div className={mdxMutedTextClass}>{children}</div> : null}
        </div>
      ) : null}
    </div>
  );
}
