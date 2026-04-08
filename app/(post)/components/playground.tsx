"use client";

import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { mdxInsetClass, mdxMutedTextClass, mdxPanelClass } from "./surface";

type PlaygroundProps = {
  initialCode: string;
  title?: string;
  description?: ReactNode;
  height?: number;
};

export function Playground({ initialCode, title, description, height = 240 }: PlaygroundProps) {
  const [code, setCode] = useState(initialCode.trim());
  const [html, setHtml] = useState("");
  const [copied, setCopied] = useState(false);

  const srcDoc = useMemo(
    () =>
      `
<!doctype html>
<html>
<head>
<style>
body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
</style>
</head>
<body>
<div id="root"></div>
<script type="module">
${html}
</script>
</body>
</html>`,
    [html],
  );

  useEffect(() => {
    setHtml(code);
  }, [code]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // noop
    }
  };

  return (
    <div className={mdxPanelClass}>
      <div className="flex items-start justify-between gap-2">
        <div>
          {title && <p className="text-sm font-semibold text-slate-900 dark:text-white">{title}</p>}
          {description && <p className={mdxMutedTextClass}>{description}</p>}
        </div>
        <button
          type="button"
          onClick={handleCopy}
          className={`rounded-full border px-3 py-1 text-xs font-semibold shadow-sm transition ${
            copied
              ? "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-400/40 dark:bg-emerald-500/10 dark:text-emerald-200"
              : "border-slate-300/80 bg-white/80 text-slate-800 hover:border-blue-400 hover:text-blue-600 dark:border-white/15 dark:bg-white/10 dark:text-slate-100 dark:hover:text-blue-200"
          }`}
        >
          {copied ? "Copied" : "Copy code"}
        </button>
      </div>
      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <textarea
          className="h-[240px] w-full rounded-2xl border border-slate-200/70 bg-slate-950/95 p-3 font-mono text-sm text-slate-100 shadow-inner focus:outline-none focus:ring-2 focus:ring-blue-400 dark:border-white/10"
          value={code}
          onChange={e => setCode(e.target.value)}
          spellCheck={false}
        />
        <iframe
          title="playground"
          sandbox="allow-scripts"
          className={`${mdxInsetClass} h-[240px] w-full bg-white`}
          srcDoc={srcDoc}
          style={{ minHeight: height }}
        />
      </div>
    </div>
  );
}
