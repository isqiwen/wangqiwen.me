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
};

type ElementWithChildren = { className?: string; children?: ReactNode };

type SnippetComponent = ((props: SnippetProps) => ReactElement) & {
  __snippetComponent?: true;
};

export const Snippet: SnippetComponent = ({ children, scroll = true, caption = null }) => {
  const { code, className } = extractContent(children);
  const language = getLanguage(className);

  return (
    <div className="my-6">
      <Highlight theme={themes.nightOwl} code={code} language={language}>
        {({ className: highlightClass, style, tokens, getLineProps, getTokenProps }) => (
          <pre
            className={`p-4 text-sm bg-gray-800 text-white dark:bg-[#222] dark:text-gray-300 ${
              scroll ? "overflow-scroll" : "whitespace-pre-wrap break-all overflow-hidden"
            } ${highlightClass}`}
            style={style}
          >
            {tokens.map((line, lineIndex) => {
              const lineProps = getLineProps({ line });
              return (
                <div key={lineIndex} {...lineProps}>
                  {line.map((token, tokenIndex) => {
                    const tokenProps = getTokenProps({ token });
                    return <span key={tokenIndex} {...tokenProps} />;
                  })}
                </div>
              );
            })}
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
