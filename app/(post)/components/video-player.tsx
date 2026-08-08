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

type VideoPlayerProps = {
  src: string;
  poster?: string;
  title?: string;
  chapters?: Chapter[];
  children?: ReactNode;
};

export function VideoPlayer({ src, poster, title, chapters = [], children }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [now, setNow] = useState(0);

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
