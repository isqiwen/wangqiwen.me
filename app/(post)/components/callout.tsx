import { mdxMutedTextClass } from "./surface";

type CalloutProps = {
  children: React.ReactNode;
  type?: "note" | "caution" | "important";
  title?: string | null;
};

const styles = {
  note: "border-slate-400 text-slate-800 dark:text-slate-200",
  caution: "border-amber-600 text-slate-800 dark:text-slate-200",
  important: "border-sky-700 text-slate-800 dark:text-slate-200",
};

const labels: Record<NonNullable<CalloutProps["type"]>, string> = {
  note: "Note",
  caution: "Caution",
  important: "Important",
};

export const Callout = ({
  children,
  type = "note",
  title = null,
}: CalloutProps) => (
  <aside className={`my-6 border-l-2 pl-4 text-base ${styles[type]}`}>
    <p className="font-semibold text-slate-950 dark:text-white">
      <span className="mr-2 text-xs font-medium uppercase tracking-[0.14em] text-current">
        {labels[type]}
      </span>
      {title ? <span>{title}</span> : null}
    </p>
    <div className={`mt-1 ${mdxMutedTextClass}`}>{children}</div>
  </aside>
);
