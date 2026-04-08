"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { RawImage } from "./raw-image";
import {
  mdxEmptyStateClass,
  mdxInsetClass,
  mdxMutedTextClass,
  mdxPanelClass,
} from "./surface";

type ImageItem = {
  src: string;
  alt?: string;
  caption?: ReactNode;
};

type ImageGridProps = {
  images: ImageItem[];
};

export function ImageGrid({ images }: ImageGridProps) {
  const [active, setActive] = useState<ImageItem | null>(null);

  useEffect(() => {
    if (!active) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setActive(null);
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [active]);

  if (images.length === 0) {
    return (
      <div className={mdxPanelClass}>
        <div className={mdxEmptyStateClass}>No images were provided for this grid.</div>
      </div>
    );
  }

  return (
    <div className={mdxPanelClass}>
      <div className="grid gap-3 sm:grid-cols-2">
        {images.map((img, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => setActive(img)}
            className={`${mdxInsetClass} group overflow-hidden p-0 text-left shadow-sm transition hover:scale-[1.01] hover:shadow-lg`}
            aria-label={`Open image ${idx + 1}`}
          >
            <RawImage
              src={img.src}
              alt={img.alt ?? `Image ${idx + 1}`}
              className="aspect-[4/3] h-full w-full object-cover"
            />
            {img.caption ? (
              <div className={`px-3 py-2 text-left ${mdxMutedTextClass} group-hover:text-slate-700 dark:group-hover:text-slate-200`}>
                {img.caption}
              </div>
            ) : null}
          </button>
        ))}
      </div>

      {active && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setActive(null)}
          role="presentation"
        >
          <div
            className="relative max-h-[90vh] max-w-5xl overflow-hidden rounded-3xl bg-white p-4 shadow-2xl dark:bg-slate-950"
            onClick={e => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label={active.alt ?? "Image preview"}
          >
            <button
              type="button"
              className="absolute right-4 top-4 rounded-full bg-black/70 px-3 py-1 text-xs text-white shadow"
              onClick={() => setActive(null)}
            >
              Close
            </button>
            <RawImage
              src={active.src}
              alt={active.alt ?? ""}
              loading="eager"
              className="max-h-[70vh] w-full object-contain"
            />
            {active.caption ? (
              <div className="mt-3 text-center text-sm text-slate-600 dark:text-slate-300">{active.caption}</div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
