import type { ReactNode } from "react";
import { mdxMutedTextClass, mdxSubtleTextClass } from "./surface";

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
  children?: ReactNode;
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
    <section
      className={`mt-12 border-t border-slate-200 pt-7 dark:border-slate-800 ${className}`.trim()}
      aria-label={title}
    >
      <div>
        <p className={mdxSubtleTextClass}>Sources</p>
        <h3 className="mt-1 text-xl font-semibold text-slate-950 dark:text-white">
          {title}
        </h3>
        {note ? (
          <p className={`mt-2 max-w-2xl ${mdxMutedTextClass}`}>{note}</p>
        ) : null}
      </div>

      <ol className="mt-5 space-y-5">{children}</ol>
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
  children,
}: BibliographyItemProps) {
  const authorList = asList(authors);
  const metadata = [authorList.join(", "), venue, year]
    .filter(Boolean)
    .join(" · ");
  const detail = children ?? note;

  return (
    <li id={`ref-${id}`} className="scroll-mt-8">
      <div className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-3">
        <span className="font-mono text-sm text-slate-500 dark:text-slate-400">
          {label || id}
        </span>
        <div className="min-w-0">
          <p className="font-medium leading-6 text-slate-950 dark:text-white">
            {title}
          </p>
          {metadata ? (
            <p className={`mt-1 ${mdxMutedTextClass}`}>{metadata}</p>
          ) : null}
          {detail ? (
            <div className="mt-2 text-sm leading-7 text-slate-700 dark:text-slate-200">
              {detail}
            </div>
          ) : null}
          {links.length ? (
            <p className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-sm">
              {links.map(link => (
                <a
                  key={`${link.label}-${link.href}`}
                  href={link.href}
                  target="_blank"
                  rel="noreferrer"
                  className="font-medium text-slate-700 underline decoration-slate-300 underline-offset-4 transition hover:decoration-slate-700 dark:text-slate-200 dark:decoration-slate-600 dark:hover:decoration-slate-200"
                >
                  {link.label}
                </a>
              ))}
            </p>
          ) : null}
        </div>
      </div>
    </li>
  );
}
