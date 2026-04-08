import type { ReactNode } from "react";
import {
  mdxInsetClass,
  mdxMutedTextClass,
  mdxPanelClass,
  mdxSubtleTextClass,
} from "./surface";

type PaperLink = {
  label: string;
  href: string;
};

type PaperCardProps = {
  title: string;
  authors?: string | string[];
  venue?: string;
  year?: string | number;
  summary?: ReactNode;
  children?: ReactNode;
  tags?: string | string[];
  links?: PaperLink[];
  status?: string;
};

function asList(value?: string | string[]) {
  if (!value) {
    return [];
  }

  return Array.isArray(value) ? value : [value];
}

export function PaperCard({
  title,
  authors,
  venue,
  year,
  summary,
  children,
  tags,
  links = [],
  status,
}: PaperCardProps) {
  const authorList = asList(authors);
  const tagList = asList(tags);
  const body = children ?? summary;

  return (
    <section className={mdxPanelClass}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-2">
          <p className={mdxSubtleTextClass}>Paper Reference</p>
          <div>
            <h3 className="text-xl font-semibold text-slate-950 dark:text-white">
              {title}
            </h3>
            <p className={`mt-2 ${mdxMutedTextClass}`}>
              {authorList.length ? authorList.join(", ") : "Add authors"}
              {venue || year ? " · " : ""}
              {venue ? venue : null}
              {venue && year ? ", " : null}
              {year ? year : null}
            </p>
          </div>
        </div>

        {status ? (
          <div className="rounded-full bg-slate-900 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-white dark:bg-white dark:text-slate-950">
            {status}
          </div>
        ) : null}
      </div>

      {body ? (
        <div className={`${mdxInsetClass} mt-5 px-4 py-4 sm:px-5`}>
          <div className={`text-sm leading-7 text-slate-700 dark:text-slate-200`}>
            {body}
          </div>
        </div>
      ) : null}

      {tagList.length ? (
        <div className="mt-5 flex flex-wrap gap-2">
          {tagList.map(tag => (
            <span
              key={tag}
              className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300"
            >
              {tag}
            </span>
          ))}
        </div>
      ) : null}

      {links.length ? (
        <div className="mt-5 flex flex-wrap gap-2">
          {links.map(link => (
            <a
              key={`${link.label}-${link.href}`}
              href={link.href}
              target="_blank"
              rel="noreferrer"
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-950 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:border-white/20 dark:hover:text-white"
            >
              {link.label}
            </a>
          ))}
        </div>
      ) : null}
    </section>
  );
}
