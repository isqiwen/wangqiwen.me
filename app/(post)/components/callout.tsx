import { mdxMutedTextClass, mdxPanelClass } from "./surface";

type CalloutProps = {
  emoji?: string | null;
  text?: string | null;
  children?: React.ReactNode;
  type?: "info" | "warning" | "success";
  title?: string | null;
};

const styles = {
  info: "border-blue-200 bg-blue-50 text-blue-900 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-100",
  warning:
    "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100",
  success:
    "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-100",
};

const defaultIcon: Record<NonNullable<CalloutProps["type"]>, string> = {
  info: "i",
  warning: "!",
  success: "+",
};

export const Callout = ({
  emoji = null,
  text = null,
  children,
  type = "info",
  title = null,
}: CalloutProps) => (
  <div className={`${mdxPanelClass} flex items-start gap-3 border p-4 text-base ${styles[type]}`}>
    <span className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-current/20 bg-white/60 text-sm font-semibold dark:bg-black/20">
      {emoji ?? defaultIcon[type]}
    </span>
    <span className="block grow">
      {title ? <span className="mb-1 block text-sm font-semibold">{title}</span> : null}
      <span className={mdxMutedTextClass}>{text ?? children}</span>
    </span>
  </div>
);
