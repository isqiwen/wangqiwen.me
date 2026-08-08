import type { ReactNode } from "react";
import { mdxMutedTextClass } from "./surface";

type TheoremBlockProps = {
  id?: string;
  kind?:
    | "theorem"
    | "lemma"
    | "proposition"
    | "corollary"
    | "assumption"
    | "note";
  label?: string;
  title?: string;
  children: ReactNode;
  footer?: ReactNode;
};

export function TheoremBlock({
  id,
  kind = "theorem",
  label,
  title,
  children,
  footer,
}: TheoremBlockProps) {
  const kindLabel = kind.charAt(0).toUpperCase() + kind.slice(1);
  const prefix = [kindLabel, label].filter(Boolean).join(" ");

  return (
    <section
      id={id}
      data-reference-kind={id ? kind : undefined}
      className="my-10 border-y border-slate-300 py-6 scroll-mt-24 dark:border-white/20"
    >
      <p className="text-base leading-8 text-slate-900 dark:text-white">
        <span className="font-semibold">{prefix}.</span>{" "}
        {title ? <span className="italic">{title}.</span> : null}
      </p>

      <div className="mt-3 text-base leading-8 text-slate-700 dark:text-slate-200">
        {children}
      </div>

      {footer ? <div className={`mt-3 ${mdxMutedTextClass}`}>{footer}</div> : null}
    </section>
  );
}
