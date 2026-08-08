import type { ReactNode } from "react";
import { mdxMutedTextClass } from "./surface";

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
    <aside className="my-8 border-l-2 border-slate-300 pl-5 dark:border-slate-600">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-slate-950 dark:text-white">{title}</p>
          <p className={`mt-2 ${mdxMutedTextClass}`}>
            {authorList.length ? authorList.join(", ") : "Add authors"}
            {venue || year ? " · " : ""}
            {venue ? venue : null}
            {venue && year ? ", " : null}
            {year ? year : null}
          </p>
        </div>

        {status ? (
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">{status}</p>
        ) : null}
      </div>

      {body ? (
        <div className="mt-4 text-sm leading-7 text-slate-700 dark:text-slate-200">{body}</div>
      ) : null}

      {tagList.length ? (
        <p className="mt-5 text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
          Topics: {tagList.join(" · ")}
        </p>
      ) : null}

      {links.length ? (
        <div className="mt-5 flex flex-wrap gap-x-4 gap-y-2">
          {links.map(link => (
            <a
              key={`${link.label}-${link.href}`}
              href={link.href}
              target="_blank"
              rel="noreferrer"
              className="text-sm font-semibold text-slate-700 underline decoration-slate-300 underline-offset-4 transition hover:text-slate-950 dark:text-slate-200 dark:decoration-slate-600 dark:hover:text-white"
            >
              {link.label}
            </a>
          ))}
        </div>
      ) : null}
    </aside>
  );
}
