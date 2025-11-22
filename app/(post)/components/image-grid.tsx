"use client";

import { useState } from "react";
import type { ReactNode } from "react";

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

  return (
    <div className="my-4">
      <div className="grid gap-3 sm:grid-cols-2">
        {images.map((img, idx) => (
          <button
            key={idx}
            onClick={() => setActive(img)}
            className="group overflow-hidden rounded-2xl border border-white/10 bg-white/5 shadow-sm transition hover:scale-[1.01] hover:shadow-lg"
          >
            <img src={img.src} alt={img.alt ?? ""} className="h-full w-full object-cover" />
            {img.caption ? (
              <div className="px-3 py-2 text-left text-xs text-slate-500 group-hover:text-slate-700">
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
        >
          <div
            className="relative max-h-[90vh] max-w-5xl overflow-hidden rounded-3xl bg-white p-4 shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <button
              className="absolute right-4 top-4 rounded-full bg-black/70 px-3 py-1 text-xs text-white shadow"
              onClick={() => setActive(null)}
            >
              关闭
            </button>
            <img src={active.src} alt={active.alt ?? ""} className="max-h-[70vh] w-full object-contain" />
            {active.caption ? (
              <div className="mt-3 text-center text-sm text-slate-600">{active.caption}</div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
