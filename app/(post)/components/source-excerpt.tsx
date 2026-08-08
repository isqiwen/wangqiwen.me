import type { ReactNode } from "react";
import { RawImage } from "./raw-image";
import { mdxMutedTextClass, mdxSubtleTextClass } from "./surface";

type SourceExcerptFacsimile = {
  src: string;
  alt: string;
  caption?: ReactNode;
};

type SourceExcerptProps = {
  id?: string;
  title?: string;
  /** Compact keeps short witnesses side by side; reading gives long text more line length. */
  layout?: "compact" | "reading";
  source: ReactNode;
  repository?: ReactNode;
  collection?: ReactNode;
  locator?: ReactNode;
  date?: ReactNode;
  facsimile?: SourceExcerptFacsimile;
  transcription?: ReactNode;
  transcriptionLabel?: string;
  reading?: ReactNode;
  readingLabel?: string;
  translation?: ReactNode;
  translationLabel?: string;
  note?: ReactNode;
};

type TextColumn = {
  label: string;
  content: ReactNode;
};

export function SourceExcerpt({
  id,
  title,
  layout = "compact",
  source,
  repository,
  collection,
  locator,
  date,
  facsimile,
  transcription,
  transcriptionLabel = "Diplomatic transcription",
  reading,
  readingLabel = "Reading text",
  translation,
  translationLabel = "Translation",
  note,
}: SourceExcerptProps) {
  const columns: TextColumn[] = [];
  if (transcription) {
    columns.push({ label: transcriptionLabel, content: transcription });
  }
  if (reading) {
    columns.push({ label: readingLabel, content: reading });
  }
  if (translation) {
    columns.push({ label: translationLabel, content: translation });
  }

  const readingLayout = layout === "reading" && Boolean(facsimile && columns.length > 1);

  return (
    <figure
      id={id}
      data-reference-kind={id ? "source" : undefined}
      className="my-10 scroll-mt-24 border-y border-slate-200 py-6 dark:border-white/10"
    >
      <figcaption className="border-b border-slate-200 pb-5 dark:border-white/10">
        <p className={mdxSubtleTextClass}>Primary source</p>
        {title ? (
          <p className="mt-1 font-semibold text-slate-950 dark:text-white">{title}</p>
        ) : null}
        <dl className="mt-4 grid gap-x-6 gap-y-2 text-sm leading-6 text-slate-600 sm:grid-cols-2 dark:text-slate-300">
          <MetadataItem label="Source">{source}</MetadataItem>
          {date ? <MetadataItem label="Date">{date}</MetadataItem> : null}
          {repository ? <MetadataItem label="Repository">{repository}</MetadataItem> : null}
          {collection ? <MetadataItem label="Collection">{collection}</MetadataItem> : null}
          {locator ? <MetadataItem label="Locator">{locator}</MetadataItem> : null}
        </dl>
      </figcaption>

      <div
        className={`mt-6 ${
          readingLayout
            ? "space-y-6"
            : facsimile && columns.length
            ? "grid gap-6 xl:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)]"
            : ""
        }`}
      >
        {facsimile ? <Facsimile facsimile={facsimile} readingLayout={readingLayout} /> : null}

        {columns.length ? <TextColumns columns={columns} readingLayout={readingLayout} /> : null}
      </div>

      {note ? <p className={`mt-5 ${mdxMutedTextClass}`}>{note}</p> : null}
    </figure>
  );
}

function Facsimile({
  facsimile,
  readingLayout,
}: {
  facsimile: SourceExcerptFacsimile;
  readingLayout: boolean;
}) {
  return (
    <div className={readingLayout ? "max-w-3xl" : ""}>
      <div className="border border-slate-200 bg-slate-50 p-3 dark:border-white/10 dark:bg-white/[0.03]">
        <RawImage
          src={facsimile.src}
          alt={facsimile.alt}
          className="h-auto w-full"
        />
      </div>
      {facsimile.caption ? (
        <p className={`mt-3 ${mdxMutedTextClass}`}>{facsimile.caption}</p>
      ) : null}
    </div>
  );
}

function TextColumns({
  columns,
  readingLayout,
}: {
  columns: TextColumn[];
  readingLayout: boolean;
}) {
  const columnClassName = readingLayout
    ? columns.length === 1
      ? ""
      : "md:grid-cols-2"
    : columns.length === 1
    ? ""
    : columns.length === 2
    ? "md:grid-cols-2"
    : "md:grid-cols-2 xl:grid-cols-3";

  return (
    <div className={`grid gap-6 ${columnClassName}`}>
      {columns.map((column, index) => (
        <section
          key={column.label}
          className={index ? "border-l border-slate-200 pl-5 dark:border-white/10" : ""}
          aria-label={column.label}
        >
          <p className={mdxSubtleTextClass}>{column.label}</p>
          <div className="mt-3 whitespace-pre-wrap text-[0.96rem] leading-7 text-slate-800 dark:text-slate-100">
            {column.content}
          </div>
        </section>
      ))}
    </div>
  );
}

function MetadataItem({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-2">
      <dt className="font-medium text-slate-900 dark:text-white">{label}.</dt>
      <dd>{children}</dd>
    </div>
  );
}
