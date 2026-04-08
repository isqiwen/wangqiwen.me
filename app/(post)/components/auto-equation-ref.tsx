"use client";

import { useEffect, useState } from "react";

type AutoEquationRefProps = {
  target: string;
  prefix?: string;
  fallbackLabel?: string;
  className?: string;
};

export function AutoEquationRef({
  target,
  prefix = "Eq.",
  fallbackLabel = "(?)",
  className = "",
}: AutoEquationRefProps) {
  const [label, setLabel] = useState(fallbackLabel);

  useEffect(() => {
    const update = () => {
      const element = document.getElementById(target);
      const nextLabel =
        element?.getAttribute("data-equation-label") ||
        element?.getAttribute("data-equation-number");

      if (nextLabel) {
        setLabel(nextLabel.startsWith("(") ? nextLabel : `(${nextLabel})`);
      }
    };

    update();

    const observer = new MutationObserver(update);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["data-equation-label", "data-equation-number"],
    });

    return () => observer.disconnect();
  }, [target]);

  return (
    <a
      href={`#${target}`}
      className={`font-medium text-slate-900 underline decoration-slate-300 underline-offset-4 transition hover:decoration-slate-600 dark:text-slate-100 dark:decoration-slate-600 dark:hover:decoration-slate-300 ${className}`.trim()}
    >
      {prefix ? `${prefix} ${label}` : label}
    </a>
  );
}
