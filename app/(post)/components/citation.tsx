import type { ReactNode } from "react";
import {
  mdxInsetClass,
  mdxMutedTextClass,
  mdxPanelClass,
  mdxSubtleTextClass,
} from "./surface";

type CitationProps = {
  refId?: string;
  label?: string;
  href?: string;
  className?: string;
};

type BibliographyProps = {
  title?: string;
  children: ReactNode;
  note?: ReactNode;
  className?: string;
};

type BibliographyLink = {
  label: string;
  href: string;
};

type BibliographyItemProps = {
  id: string;
  label?: string;
  title: string;
  authors?: string | string[];
  venue?: string;
  year?: string | number;
  note?: ReactNode;
  links?: BibliographyLink[];
};

function asList(value?: string | string[]) {
  if (!value) {
    return [];
  }

  return Array.isArray(value) ? value : [value];
}

export function Citation({
  refId,
  label,
  href,
  className = "",
}: CitationProps) {
  const target = href || (refId ? `#ref-${refId}` : undefined);
  const text = label?.trim() || (refId ? `[${refId}]` : "[ref]");

  if (!target) {
    return <span className={className}>{text}</span>;
  }

  return (
    <a
      href={target}
      className={`align-super text-xs font-semibold text-slate-700 underline decoration-slate-300 underline-offset-4 transition hover:decoration-slate-600 dark:text-slate-300 dark:decoration-slate-600 dark:hover:decoration-slate-300 ${className}`.trim()}
    >
      {text}
    </a>
  );
}

export function Bibliography({
  title = "References",
  children,
  note,
  className = "",
}: BibliographyProps) {
  return (
    <section className={`${mdxPanelClass} ${className}`.trim()}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className={mdxSubtleTextClass}>Citations</p>
          <h3 className="mt-1 text-xl font-semibold text-slate-950 dark:text-white">
            {title}
          </h3>
        </div>
        {note ? <div className={`${mdxMutedTextClass} max-w-xl text-right`}>{note}</div> : null}
      </div>

      <ol className="mt-5 space-y-3">{children}</ol>
    </section>
  );
}

export function BibliographyItem({
  id,
  label,
  title,
  authors,
  venue,
  year,
  note,
  links = [],
}: BibliographyItemProps) {
  const authorList = asList(authors);
  const metadata = [authorList.join(", "), venue, year].filter(Boolean).join(" · ");

  return (
    <li id={`ref-${id}`} className={`${mdxInsetClass} px-4 py-4 sm:px-5`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-slate-900 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-white dark:bg-white dark:text-slate-950">
              {label || id}
            </span>
            <div className="text-base font-semibold text-slate-950 dark:text-white">
              {title}
            </div>
          </div>

          {metadata ? <p className={`mt-2 ${mdxMutedTextClass}`}>{metadata}</p> : null}
          {note ? (
            <div className="mt-3 text-sm leading-7 text-slate-700 dark:text-slate-200">
              {note}
            </div>
          ) : null}
        </div>

        {links.length ? (
          <div className="flex flex-wrap justify-end gap-2">
            {links.map(link => (
              <a
                key={`${link.label}-${link.href}`}
                href={link.href}
                target="_blank"
                rel="noreferrer"
                className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-slate-600 transition hover:border-slate-300 hover:text-slate-900 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:border-white/20 dark:hover:text-white"
              >
                {link.label}
              </a>
            ))}
          </div>
        ) : null}
      </div>
    </li>
  );
}
