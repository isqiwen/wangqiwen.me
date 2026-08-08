"use client";

import { Caption } from "./caption";
import { Highlight, themes } from "prism-react-renderer";
import type { Language } from "prism-react-renderer";
import { Children, isValidElement } from "react";
import type { ReactElement, ReactNode } from "react";

type SnippetProps = {
  children: ReactNode;
  scroll?: boolean;
  caption?: ReactNode;
  className?: string;
  label?: ReactNode;
  language?: Language;
  lineNumbers?: boolean;
};

type ElementWithChildren = { className?: string; children?: ReactNode };

type SnippetComponent = ((props: SnippetProps) => ReactElement) & {
  __snippetComponent?: true;
};

export const Snippet: SnippetComponent = ({
  children,
  scroll = true,
  caption = null,
  className,
  label = null,
  language: languageOverride,
  lineNumbers = false,
}) => {
  const { code: rawCode, className: contentClassName } = extractContent(children);
  const code = trimEmptyLines(rawCode);
  const language = languageOverride ?? getLanguage(contentClassName);
  const containerClass = className ?? "my-6";

  return (
    <div className={containerClass}>
      {label != null ? (
        <p className="mb-2 font-mono text-xs font-medium uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
          {label}
        </p>
      ) : null}
      <Highlight theme={themes.nightOwl} code={code} language={language}>
        {({ className: highlightClass, style, tokens, getLineProps, getTokenProps }) => (
          <pre
            className={`overflow-x-auto rounded-xl border border-slate-700/70 bg-gray-800 p-0 text-sm text-white dark:bg-[#222] dark:text-gray-300 ${
              scroll ? "overflow-y-hidden" : "whitespace-pre-wrap break-words overflow-hidden"
            } ${highlightClass}`}
            style={style}
          >
            <code className={`block py-3 ${scroll ? "min-w-max" : "min-w-0"}`}>
              {tokens.map((line, lineIndex) => {
                const { className: lineClassName, ...lineProps } = getLineProps({ line });

                return (
                  <span
                    key={lineIndex}
                    {...lineProps}
                    className={`${lineNumbers ? "flex" : "block"} min-h-5 px-4 ${lineClassName}`}
                  >
                    {lineNumbers ? (
                      <span
                        aria-hidden="true"
                        className="mr-4 w-8 shrink-0 select-none text-right text-slate-500"
                      >
                        {lineIndex + 1}
                      </span>
                    ) : null}
                    <span className={lineNumbers ? "min-w-0 grow" : undefined}>
                      {line.map((token, tokenIndex) => {
                        const tokenProps = getTokenProps({ token });
                        return <span key={tokenIndex} {...tokenProps} />;
                      })}
                    </span>
                  </span>
                );
              })}
            </code>
          </pre>
        )}
      </Highlight>
      {caption != null ? <Caption>{caption}</Caption> : null}
    </div>
  );
};

Snippet.__snippetComponent = true;

function extractContent(children: ReactNode): { code: string; className?: string } {
  if (typeof children === "string") {
    return { code: children, className: undefined };
  }

  if (Array.isArray(children)) {
    const flattened = Children.toArray(children).filter(Boolean);
    if (flattened.length === 1) {
      return extractContent(flattened[0]);
    }
    return {
      code: flattened
        .map(node => (typeof node === "string" ? node : extractContent(node).code))
        .join(""),
      className: undefined,
    };
  }

  if (isValidElement<ElementWithChildren>(children)) {
    const className = children.props?.className;
    const content = extractContent(children.props?.children ?? "").code;
    return { code: content, className };
  }

  return { code: "", className: undefined };
}

function trimEmptyLines(code: string): string {
  const lines = code.split(/\r?\n/);

  while (lines.length && lines[0].trim() === "") {
    lines.shift();
  }

  while (lines.length && lines[lines.length - 1].trim() === "") {
    lines.pop();
  }

  return lines.join("\n");
}

function getLanguage(className?: string): Language {
  if (!className) {
    return "tsx" as Language;
  }

  const match = className.match(/language-([\w-]+)/);
  if (match?.[1]) {
    return match[1] as Language;
  }

  return "tsx" as Language;
}
