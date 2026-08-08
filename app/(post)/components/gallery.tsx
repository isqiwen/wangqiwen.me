import type { CSSProperties, ReactNode } from "react";
import { RawImage } from "./raw-image";
import {
  clampCount,
  mdxEmptyStateClass,
  mdxMutedTextClass,
} from "./surface";

type GalleryItem = {
  src: string;
  alt?: string;
  caption?: ReactNode;
};

export function Gallery({ images, columns = 3 }: { images: GalleryItem[]; columns?: number }) {
  if (images.length === 0) {
    return (
      <div className={mdxEmptyStateClass}>No gallery images were provided.</div>
    );
  }

  const safeColumns = clampCount(columns, 1, 4);
  const gridStyle = {
    "--gallery-columns": String(safeColumns),
  } as CSSProperties;

  return (
    <div
      className="my-10 grid grid-cols-1 gap-x-5 gap-y-7 md:[grid-template-columns:repeat(var(--gallery-columns),minmax(0,1fr))]"
      style={gridStyle}
    >
      {images.map((image, idx) => (
        <figure key={`${image.src}-${idx}`}>
          <RawImage
            src={image.src}
            alt={image.alt ?? `Gallery image ${idx + 1}`}
            className="aspect-[4/3] w-full border border-slate-200/80 object-cover dark:border-white/10"
          />
          {image.caption && (
            <figcaption className={`mt-3 ${mdxMutedTextClass}`}>{image.caption}</figcaption>
          )}
        </figure>
      ))}
    </div>
  );
}
