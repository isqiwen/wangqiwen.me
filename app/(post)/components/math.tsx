import { renderToString } from "katex";
import { mdxMutedTextClass } from "./surface";

type InlineMathProps = {
  tex: string;
  className?: string;
};

type MathBlockProps = {
  tex: string;
  id?: string;
  label?: string;
  caption?: string;
  className?: string;
  numbering?: "global" | "manual";
};

export function renderMathMarkup(tex: string, displayMode: boolean) {
  const source = tex.trim();

  if (!source) {
    return renderToString("\\text{Add math here}", {
      displayMode,
      throwOnError: false,
      strict: "ignore",
    });
  }

  return renderToString(source, {
    displayMode,
    throwOnError: false,
    strict: "ignore",
  });
}

export function InlineMath({ tex, className = "" }: InlineMathProps) {
  return (
    <span
      className={`mdx-inline-math ${className}`.trim()}
      dangerouslySetInnerHTML={{ __html: renderMathMarkup(tex, false) }}
    />
  );
}

export function MathBlock({
  tex,
  id,
  label,
  caption,
  className = "",
  numbering = id ? "global" : "manual",
}: MathBlockProps) {
  const displayLabel = numbering === "manual" ? label?.trim() ?? "" : "";
  const showLabelSlot = Boolean(id || displayLabel);

  return (
    <section
      id={id}
      data-equation-id={id || undefined}
      data-equation-numbering={numbering}
      data-equation-label={displayLabel || undefined}
      className={`my-8 scroll-mt-24 ${className}`.trim()}
      aria-label={caption || label || "Displayed equation"}
    >
      <div className="relative border-y border-slate-200 py-4 dark:border-white/10">
        <div className="min-w-0 pr-12">
          <div
            className="mdx-math-block text-slate-950 dark:text-white"
            dangerouslySetInnerHTML={{ __html: renderMathMarkup(tex, true) }}
          />
        </div>

        {showLabelSlot ? (
          <span
            data-equation-label-slot
            className="absolute right-0 top-1/2 -translate-y-1/2 font-mono text-sm text-slate-500 dark:text-slate-400"
          >
            {displayLabel}
          </span>
        ) : null}
      </div>

      {caption ? <p className={`mt-3 ${mdxMutedTextClass}`}>{caption}</p> : null}
    </section>
  );
}
