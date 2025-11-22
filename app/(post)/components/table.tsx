import { Children, type ReactNode, type TableHTMLAttributes, type HTMLAttributes } from "react";

function clean(children: ReactNode) {
  return Children.toArray(children).filter(child => {
    return !(typeof child === "string" && child.trim() === "");
  });
}

export function Table({ className = "", children, ...rest }: TableHTMLAttributes<HTMLTableElement>) {
  return (
    <div className="my-6 overflow-x-auto rounded-2xl border border-slate-200/60 bg-white/80 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5">
      <table
        {...rest}
        className={`w-full min-w-max border-collapse text-sm text-slate-900 dark:text-slate-200 ${className}`}
      >
        {clean(children)}
      </table>
    </div>
  );
}

export function THead({ className = "", children, ...rest }: HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <thead
      {...rest}
      className={`bg-slate-100 text-xs uppercase tracking-[0.3em] text-slate-500 dark:bg-white/5 dark:text-slate-400 ${className}`}
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
      className={`px-4 py-3 text-left font-semibold text-slate-900 dark:text-white ${className}`}
    >
      {content}
    </th>
  );
}

export function TD({ className = "", children, ...rest }: HTMLAttributes<HTMLTableCellElement>) {
  const content = clean(children);
  return (
    <td {...rest} className={`px-4 py-3 text-slate-700 dark:text-slate-200 ${className}`}>
      {content}
    </td>
  );
}
