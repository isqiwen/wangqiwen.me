import { mdxMutedTextClass } from "./surface";

type CalloutProps = {
  children: React.ReactNode;
  type?: "note" | "caution" | "important";
};

type CalloutType = NonNullable<CalloutProps["type"]>;

const styles = {
  note: "border-slate-400 bg-slate-50/80 text-slate-800 dark:bg-white/[0.04] dark:text-slate-200",
  caution:
    "border-amber-600 bg-amber-50/80 text-slate-800 dark:bg-amber-400/[0.06] dark:text-slate-200",
  important:
    "border-sky-700 bg-sky-50/80 text-slate-800 dark:bg-sky-400/[0.06] dark:text-slate-200",
};

const labels: Record<CalloutType, string> = {
  note: "Note",
  caution: "Caution",
  important: "Important",
};

const markerStyles: Record<CalloutType, string> = {
  note: "text-slate-500 dark:text-slate-400",
  caution: "text-amber-700 dark:text-amber-400",
  important: "text-sky-700 dark:text-sky-400",
};

function CalloutMarker({ type }: { type: CalloutType }) {
  if (type === "caution") {
    return (
      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M8 2.25 14 13H2L8 2.25Z" />
        <path d="M8 6v3.25M8 11.5v.25" strokeLinecap="round" />
      </svg>
    );
  }

  if (type === "important") {
    return (
      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="m8 2 5.5 6L8 14 2.5 8 8 2Z" />
        <circle cx="8" cy="8" r="1" fill="currentColor" stroke="none" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="8" cy="8" r="5.5" />
      <path d="M8 7v3.25M8 5.25v.25" strokeLinecap="round" />
    </svg>
  );
}

export const Callout = ({
  children,
  type = "note",
}: CalloutProps) => (
  <aside className={`my-6 border-l-[3px] py-3 pl-4 pr-4 text-base ${styles[type]}`}>
    <p
      className={`flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.14em] ${markerStyles[type]}`}
    >
      <span aria-hidden="true" className="inline-flex h-4 w-4 shrink-0">
        <CalloutMarker type={type} />
      </span>
      <span>{labels[type]}</span>
    </p>
    <div className={`mt-2 [&_p]:my-0 ${mdxMutedTextClass}`}>{children}</div>
  </aside>
);
