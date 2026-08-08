"use client";

import { useEffect, useId, useState } from "react";
import {
  mdxEmptyStateClass,
  mdxMutedTextClass,
} from "./surface";

type MermaidDiagramProps = {
  chart: string;
  title?: string;
  caption?: string;
  theme?: "default" | "neutral" | "forest" | "dark";
};

export function MermaidDiagram({
  chart,
  title,
  caption,
  theme = "neutral",
}: MermaidDiagramProps) {
  const [svg, setSvg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const diagramId = useId().replace(/:/g, "");

  useEffect(() => {
    let cancelled = false;

    async function renderDiagram() {
      try {
        const mermaid = (await import("mermaid")).default;
        mermaid.initialize({
          startOnLoad: false,
          securityLevel: "strict",
          theme,
          fontFamily: "Inter, sans-serif",
        });

        const { svg: renderedSvg } = await mermaid.render(
          `mdx-mermaid-${diagramId}`,
          chart.trim(),
        );

        if (!cancelled) {
          setSvg(renderedSvg);
          setError(null);
        }
      } catch (cause) {
        if (!cancelled) {
          setSvg(null);
          setError(
            cause instanceof Error
              ? cause.message
              : "Unable to render this Mermaid diagram.",
          );
        }
      }
    }

    void renderDiagram();

    return () => {
      cancelled = true;
    };
  }, [chart, diagramId, theme]);

  return (
    <figure className="my-10">
      {title ? (
        <div className="mb-5">
          <p className="font-semibold text-slate-950 dark:text-white">{title}</p>
        </div>
      ) : null}

      <div className="mt-5 border-y border-slate-200/80 px-4 py-5 dark:border-white/10 sm:px-5">
        {svg ? (
          <div
            className="mdx-mermaid"
            dangerouslySetInnerHTML={{ __html: svg }}
          />
        ) : error ? (
          <div className={mdxEmptyStateClass}>
            <p className="font-semibold text-slate-700 dark:text-slate-200">
              Mermaid render failed
            </p>
            <p className="mt-2">{error}</p>
            <pre className="mt-4 overflow-x-auto bg-slate-950 px-4 py-3 text-xs text-slate-200">
              {chart}
            </pre>
          </div>
        ) : (
          <div className={mdxEmptyStateClass}>Rendering diagram...</div>
        )}
      </div>
      {caption ? <figcaption className={`mt-4 ${mdxMutedTextClass}`}>{caption}</figcaption> : null}
    </figure>
  );
}
