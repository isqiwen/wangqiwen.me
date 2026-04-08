"use client";

import { useEffect, useState } from "react";

export function CopySnippetButton({ snippet }: { snippet: string }) {
  const [status, setStatus] = useState<"idle" | "copied" | "error">("idle");

  useEffect(() => {
    if (status === "idle") {
      return;
    }

    const timer = window.setTimeout(() => setStatus("idle"), 1800);
    return () => window.clearTimeout(timer);
  }, [status]);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(snippet);
      setStatus("copied");
    } catch {
      setStatus("error");
    }
  }

  return (
    <button
      type="button"
      onClick={() => void handleCopy()}
      className={`rounded-full px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] transition ${
        status === "copied"
          ? "bg-emerald-100 text-emerald-700"
          : status === "error"
            ? "bg-rose-100 text-rose-700"
            : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
      }`}
    >
      {status === "copied" ? "Copied" : status === "error" ? "Retry Copy" : "Copy Snippet"}
    </button>
  );
}
