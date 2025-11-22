type CalloutProps = {
  emoji?: string | null;
  text?: string | null;
  children?: React.ReactNode;
  type?: "info" | "warning" | "success";
};

const styles = {
  info: "bg-blue-50 text-blue-900 border-blue-200 dark:bg-blue-950/40 dark:text-blue-100 dark:border-blue-900",
  warning:
    "bg-amber-50 text-amber-900 border-amber-200 dark:bg-amber-950/40 dark:text-amber-100 dark:border-amber-900",
  success:
    "bg-emerald-50 text-emerald-900 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-100 dark:border-emerald-900",
};

const defaultIcon: Record<NonNullable<CalloutProps["type"]>, string> = {
  info: "💡",
  warning: "⚠️",
  success: "✅",
};

export const Callout = ({ emoji = null, text = null, children, type = "info" }: CalloutProps) => (
  <div
    className={`my-6 flex items-start gap-3 rounded-2xl border p-3 text-base shadow-sm ${styles[type]}`}
  >
    <span className="block w-6 text-center">{emoji ?? defaultIcon[type]}</span>
    <span className="block grow">{text ?? children}</span>
  </div>
);
