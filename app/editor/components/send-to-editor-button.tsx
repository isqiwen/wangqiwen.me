"use client";

import { useEffect, useState } from "react";
import {
  createPendingEditorSnippet,
  PENDING_EDITOR_SNIPPET_KEY,
} from "../pending-snippet";

export function SendToEditorButton({ snippet }: { snippet: string }) {
  const [status, setStatus] = useState<"idle" | "queued" | "error">("idle");

  useEffect(() => {
    if (status === "idle") {
      return;
    }

    const timer = window.setTimeout(() => setStatus("idle"), 2200);
    return () => window.clearTimeout(timer);
  }, [status]);

  function handleQueue() {
    try {
      const payload = createPendingEditorSnippet(snippet);
      window.localStorage.setItem(PENDING_EDITOR_SNIPPET_KEY, JSON.stringify(payload));
      setStatus("queued");
      window.location.assign("/editor#editor-body");
    } catch {
      setStatus("error");
    }
  }

  return (
    <button
      type="button"
      onClick={handleQueue}
      className={`rounded-full px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] transition ${
        status === "queued"
          ? "bg-indigo-100 text-indigo-700"
          : status === "error"
            ? "bg-rose-100 text-rose-700"
            : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
      }`}
    >
      {status === "queued" ? "Queued for Editor" : status === "error" ? "Retry Queue" : "Send to Editor"}
    </button>
  );
}
