import type { ReactNode } from "react";
import { mdxMutedTextClass } from "./surface";

type DefinitionProps = {
  /** A stable, article-local anchor, for example `def-signal-model`. */
  id: string;
  /** The name readers use when referring to this concept. */
  title: string;
  /** An optional visible index, such as `1` or `2.1`. */
  label?: string;
  children: ReactNode;
  footer?: ReactNode;
};

/** A formal, referenceable definition for concepts cited again in the article. */
export function Definition({
  id,
  title,
  label,
  children,
  footer,
}: DefinitionProps) {
  const prefix = ["Definition", label].filter(Boolean).join(" ");

  return (
    <section
      id={id}
      data-reference-kind="definition"
      className="my-10 border-l-2 border-slate-900 pl-5 scroll-mt-24 dark:border-white sm:pl-6"
    >
      <p className="text-base leading-8 text-slate-900 dark:text-white">
        <span className="font-semibold">{prefix}.</span>{" "}
        <span className="italic">{title}.</span>
      </p>

      <div className="mt-3 text-base leading-8 text-slate-700 dark:text-slate-200">
        {children}
      </div>

      {footer ? (
        <div className={`mt-3 border-t border-slate-200 pt-3 dark:border-white/10 ${mdxMutedTextClass}`}>
          {footer}
        </div>
      ) : null}
    </section>
  );
}
