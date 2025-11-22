"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";

type PlaygroundProps = {
  initialCode: string;
  title?: string;
  description?: ReactNode;
  height?: number;
};

export function Playground({ initialCode, title, description, height = 240 }: PlaygroundProps) {
  const [code, setCode] = useState(initialCode.trim());
  const [html, setHtml] = useState("");
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

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
    } catch {
      // noop
    }
  };

  return (
    <div className="my-4 rounded-3xl border border-white/10 bg-white/5 p-4 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
      <div className="flex items-start justify-between gap-2">
        <div>
          {title && <p className="text-sm font-semibold text-slate-900">{title}</p>}
          {description && <p className="text-xs text-slate-500">{description}</p>}
        </div>
        <button
          onClick={handleCopy}
          className="rounded-full border border-white/20 bg-white/60 px-3 py-1 text-xs font-semibold text-slate-800 shadow-sm transition hover:border-blue-400 hover:text-blue-600"
        >
          复制代码
        </button>
      </div>
      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <textarea
          className="h-[240px] w-full rounded-2xl border border-white/10 bg-slate-900/90 p-3 font-mono text-sm text-slate-100 shadow-inner focus:outline-none focus:ring-2 focus:ring-blue-400"
          value={code}
          onChange={e => setCode(e.target.value)}
          spellCheck={false}
        />
        <iframe
          ref={iframeRef}
          title="playground"
          sandbox="allow-scripts"
          className="h-[240px] w-full rounded-2xl border border-white/10 bg-white"
          srcDoc={srcDoc}
          style={{ minHeight: height }}
        />
      </div>
    </div>
  );
}
