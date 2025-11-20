/* eslint-disable @next/next/no-img-element */
import type { ReactNode } from "react";

type GalleryItem = {
  src: string;
  alt?: string;
  caption?: ReactNode;
};

export function Gallery({ images, columns = 3 }: { images: GalleryItem[]; columns?: number }) {
  return (
    <div
      className="my-8 grid gap-4"
      style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
    >
      {images.map((image, idx) => (
        <figure
          key={`${image.src}-${idx}`}
          className="overflow-hidden rounded-2xl border border-white/10 bg-white/5 shadow-[0_15px_40px_rgba(2,6,23,0.35)]"
        >
          <img src={image.src} alt={image.alt ?? "Gallery image"} className="h-full w-full object-cover" />
          {image.caption && (
            <figcaption className="px-3 py-2 text-xs text-slate-300">{image.caption}</figcaption>
          )}
        </figure>
      ))}
    </div>
  );
}
