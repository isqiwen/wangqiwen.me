import { renderToString } from "katex";
import {
  mdxInsetClass,
  mdxMutedTextClass,
  mdxPanelClass,
  mdxSubtleTextClass,
} from "./surface";

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

type EquationRefProps = {
  target: string;
  label?: string;
  className?: string;
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
      className={`${mdxPanelClass} scroll-mt-24 ${className}`.trim()}
      aria-label={caption || label || "Displayed equation"}
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className={`${mdxInsetClass} min-w-0 flex-1 px-4 py-5 sm:px-6`}>
          <div
            className="mdx-math-block text-slate-950 dark:text-white"
            dangerouslySetInnerHTML={{ __html: renderMathMarkup(tex, true) }}
          />
        </div>

        {showLabelSlot ? (
          <div
            data-equation-label-slot
            className={`${mdxSubtleTextClass} self-start whitespace-nowrap px-1`}
          >
            {displayLabel}
          </div>
        ) : null}
      </div>

      {caption ? <p className={`mt-4 ${mdxMutedTextClass}`}>{caption}</p> : null}
    </section>
  );
}

export function EquationRef({
  target,
  label,
  className = "",
}: EquationRefProps) {
  const text = label?.trim() || `(${target})`;

  return (
    <a
      href={`#${target}`}
      className={`font-medium text-slate-900 underline decoration-slate-300 underline-offset-4 transition hover:decoration-slate-600 dark:text-slate-100 dark:decoration-slate-600 dark:hover:decoration-slate-300 ${className}`.trim()}
    >
      {text}
    </a>
  );
}
