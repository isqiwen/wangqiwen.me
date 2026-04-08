"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import {
  mdxEmptyStateClass,
  mdxInsetClass,
  mdxPanelClass,
  mdxPillButtonClass,
} from "./surface";

type StepItem = {
  title: string;
  body: ReactNode;
  code?: string;
};

type StepPanelProps = {
  steps: StepItem[];
};

export function StepPanel({ steps }: StepPanelProps) {
  const [active, setActive] = useState(0);
  const [copied, setCopied] = useState(false);

  if (steps.length === 0) {
    return (
      <div className={mdxPanelClass}>
        <div className={mdxEmptyStateClass}>Add at least one step to render this panel.</div>
      </div>
    );
  }

  const handleCopy = async (text?: string) => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore
    }
  };

  const current = steps[Math.min(active, steps.length - 1)];

  return (
    <div className={mdxPanelClass}>
      <div className="flex flex-wrap gap-2">
        {steps.map((step, index) => (
          <button
            key={index}
            type="button"
            onClick={() => setActive(index)}
            className={mdxPillButtonClass(index === active)}
          >
            {String(index + 1).padStart(2, "0")} {step.title}
          </button>
        ))}
      </div>

      <div className={`${mdxInsetClass} mt-3 p-4 text-sm text-slate-800 dark:text-slate-100`}>
        {current?.body}
      </div>

      {current?.code ? (
        <div className={`${mdxInsetClass} mt-3 overflow-hidden bg-slate-950/95 p-3 text-sm text-slate-100 dark:border-white/15`}>
          <pre className="overflow-auto whitespace-pre-wrap break-all">{current.code}</pre>
          <button
            type="button"
            onClick={() => handleCopy(current.code)}
            className={`mt-2 rounded-full border px-3 py-1 text-xs font-semibold transition ${
              copied
                ? "border-emerald-300/70 bg-emerald-500/10 text-emerald-200"
                : "border-white/20 bg-white/10 text-slate-100 hover:border-blue-300 hover:text-blue-200"
            }`}
          >
            {copied ? "Copied" : "Copy code"}
          </button>
        </div>
      ) : null}
    </div>
  );
}
