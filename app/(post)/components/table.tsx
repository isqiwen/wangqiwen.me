import {
  Children,
  type HTMLAttributes,
  type ReactNode,
  type TableHTMLAttributes,
} from "react";

function clean(children: ReactNode) {
  return Children.toArray(children).filter(child => {
    return !(typeof child === "string" && child.trim() === "");
  });
}

type TableProps = Omit<TableHTMLAttributes<HTMLTableElement>, "title"> & {
  /** A short visible table title. Keep numbering in `label` so it stays explicit. */
  title?: ReactNode;
  /** For example, "Table 2". This is intentionally not generated automatically. */
  label?: ReactNode;
  /** Explain the table's population, measurement, or interpretation. */
  caption?: ReactNode;
  /** Identify the data source, archive, or calculation. */
  source?: ReactNode;
  /** Methods, uncertainty, abbreviations, or other table notes. */
  notes?: ReactNode;
};

export function Table({
  id,
  className = "",
  children,
  title,
  label,
  caption,
  source,
  notes,
  ...rest
}: TableProps) {
  const hasEditorialContext = Boolean(title || label || caption || source || notes);

  return (
    <figure
      id={id}
      data-reference-kind={id ? "table" : undefined}
      className={`${hasEditorialContext ? "my-10" : "my-6"} scroll-mt-24`}
    >
      {hasEditorialContext ? (
        <div className="mb-4">
          {label ? (
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
              {label}
            </p>
          ) : null}
          {title ? (
            <p className="mt-1 font-semibold text-slate-950 dark:text-white">{title}</p>
          ) : null}
        </div>
      ) : null}

      <div className="overflow-x-auto border-y border-slate-200/80 dark:border-white/10">
        <table
          {...rest}
          className={`w-full table-fixed border-collapse text-sm text-slate-900 dark:text-slate-200 ${className}`}
        >
          {clean(children)}
        </table>
      </div>

      {caption || source || notes ? (
        <figcaption className="mt-4 space-y-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
          {caption ? <p>{caption}</p> : null}
          {source ? (
            <p>
              <span className="font-medium text-slate-900 dark:text-white">Source. </span>
              {source}
            </p>
          ) : null}
          {notes ? (
            <p>
              <span className="font-medium text-slate-900 dark:text-white">Notes. </span>
              {notes}
            </p>
          ) : null}
        </figcaption>
      ) : null}
    </figure>
  );
}

export function THead({ className = "", children, ...rest }: HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <thead
      {...rest}
      className={`border-b border-slate-300/80 text-sm text-slate-600 dark:border-white/15 dark:text-slate-300 ${className}`}
    >
      {clean(children)}
    </thead>
  );
}

export function TBody({ className = "", children, ...rest }: HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <tbody {...rest} className={className}>
      {clean(children)}
    </tbody>
  );
}

export function TR({ className = "", children, ...rest }: HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr {...rest} className={`border-b border-slate-200/60 dark:border-white/10 ${className}`}>
      {clean(children)}
    </tr>
  );
}

export function TH({ className = "", children, ...rest }: HTMLAttributes<HTMLTableCellElement>) {
  const content = clean(children);
  return (
    <th
      {...rest}
      className={`break-words px-4 py-3 text-left align-top font-semibold text-slate-900 dark:text-white ${className}`}
    >
      {content}
    </th>
  );
}

export function TD({ className = "", children, ...rest }: HTMLAttributes<HTMLTableCellElement>) {
  const content = clean(children);
  return (
    <td {...rest} className={`break-words px-4 py-3 align-top text-slate-700 dark:text-slate-200 ${className}`}>
      {content}
    </td>
  );
}
