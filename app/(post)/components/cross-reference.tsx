type CrossReferenceProps = {
  /** The article-local anchor without a leading `#`. */
  target: string;
  /** Visible reference text, for example `Definition 1` or `Figure 2`. */
  label: string;
  className?: string;
};

function normalizeTarget(target: string) {
  return target.trim().replace(/^#/, "");
}

/**
 * Links to a stable anchor in the current article. `pnpm check` verifies that
 * the target is declared by a supported referenceable block or manual heading.
 */
export function CrossReference({
  target,
  label,
  className = "",
}: CrossReferenceProps) {
  const normalizedTarget = normalizeTarget(target);
  const text = label.trim() || normalizedTarget || "reference";

  return (
    <a
      href={normalizedTarget ? `#${normalizedTarget}` : undefined}
      data-cross-reference={normalizedTarget || undefined}
      className={`font-medium text-slate-900 underline decoration-slate-300 underline-offset-4 transition hover:decoration-slate-600 dark:text-slate-100 dark:decoration-slate-600 dark:hover:decoration-slate-300 ${className}`.trim()}
    >
      {text}
    </a>
  );
}
