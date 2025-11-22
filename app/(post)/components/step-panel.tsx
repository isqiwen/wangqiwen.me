"use client";

import { useState } from "react";
import type { ReactNode } from "react";

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

  const handleCopy = async (text?: string) => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // ignore
    }
  };

  const current = steps[active];

  return (
    <div className="my-4 rounded-3xl border border-white/10 bg-white/5 p-4 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
      <div className="flex flex-wrap gap-2">
        {steps.map((step, index) => (
          <button
            key={index}
            onClick={() => setActive(index)}
            className={`rounded-full px-4 py-1.5 text-xs font-semibold tracking-[0.2em] transition ${
              index === active
                ? "bg-gradient-to-r from-indigo-500 to-blue-500 text-white shadow-[0_10px_30px_rgba(79,118,255,0.45)]"
                : "border border-white/10 text-slate-500 hover:border-white/40 hover:text-slate-800"
            }`}
          >
            {String(index + 1).padStart(2, "0")} {step.title}
          </button>
        ))}
      </div>

      <div className="mt-3 rounded-2xl border border-white/10 bg-white/60 p-4 text-sm text-slate-800">
        {current?.body}
      </div>

      {current?.code ? (
        <div className="mt-3 rounded-2xl border border-white/10 bg-slate-900/90 p-3 text-sm text-slate-100">
          <pre className="overflow-auto whitespace-pre-wrap break-all">{current.code}</pre>
          <button
            onClick={() => handleCopy(current.code)}
            className="mt-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs text-slate-100 transition hover:border-blue-300 hover:text-blue-200"
          >
            复制命令/代码
          </button>
        </div>
      ) : null}
    </div>
  );
}
