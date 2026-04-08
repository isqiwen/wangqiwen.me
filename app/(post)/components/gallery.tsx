import type { CSSProperties, ReactNode } from "react";
import { RawImage } from "./raw-image";
import {
  clampCount,
  mdxEmptyStateClass,
  mdxInsetClass,
  mdxMutedTextClass,
  mdxPanelClass,
} from "./surface";

type GalleryItem = {
  src: string;
  alt?: string;
  caption?: ReactNode;
};

export function Gallery({ images, columns = 3 }: { images: GalleryItem[]; columns?: number }) {
  if (images.length === 0) {
    return (
      <div className={mdxPanelClass}>
        <div className={mdxEmptyStateClass}>No gallery images were provided.</div>
      </div>
    );
  }

  const safeColumns = clampCount(columns, 1, 4);
  const gridStyle = {
    "--gallery-columns": String(safeColumns),
  } as CSSProperties;

  return (
    <div
      className={`${mdxPanelClass} grid grid-cols-1 gap-4 md:[grid-template-columns:repeat(var(--gallery-columns),minmax(0,1fr))]`}
      style={gridStyle}
    >
      {images.map((image, idx) => (
        <figure key={`${image.src}-${idx}`} className={`${mdxInsetClass} overflow-hidden p-0 shadow-sm`}>
          <RawImage
            src={image.src}
            alt={image.alt ?? `Gallery image ${idx + 1}`}
            className="aspect-[4/3] h-full w-full object-cover"
          />
          {image.caption && (
            <figcaption className={`px-3 py-2 ${mdxMutedTextClass}`}>{image.caption}</figcaption>
          )}
        </figure>
      ))}
    </div>
  );
}
