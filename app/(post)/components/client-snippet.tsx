"use client";

import { Highlight, themes } from "prism-react-renderer";
import type { Language } from "prism-react-renderer";
import { Caption } from "./caption";
import { Children, isValidElement } from "react";
import type { ReactNode } from "react";

export function ClientSnippet({
  children,
  language,
  caption,
  scroll = true,
}: {
  children: ReactNode;
  language?: string;
  caption?: ReactNode;
  scroll?: boolean;
}) {
  const { code, lang } = extract(children, language);

  return (
    <div className="my-4">
      <Highlight theme={themes.nightOwl} code={code} language={lang}>
        {({ className, style, tokens, getLineProps, getTokenProps }) => (
          <pre
            className={`rounded-2xl border border-white/10 bg-[#0b1120] p-4 text-sm text-white ${className} ${
              scroll ? "overflow-x-auto" : "whitespace-pre-wrap break-all"
            }`}
            style={style}
          >
            {tokens.map((line, lineIndex) => {
              const { key, ...restLine } = getLineProps({ line, key: lineIndex });
              return (
                <div key={key} {...restLine}>
                  {line.map((token, tokenIndex) => {
                    const tokenProps = getTokenProps({ token, key: tokenIndex });
                    const tokenKey = tokenProps.key;
                    const { key: _, ...restToken } = tokenProps;
                    return <span key={tokenKey} {...restToken} />;
                  })}
                </div>
              );
            })}
          </pre>
        )}
      </Highlight>
      {caption && <Caption>{caption}</Caption>}
    </div>
  );
}

function extract(children: ReactNode, language?: string) {
  if (typeof children === "string") {
    return { code: children.trim(), lang: (language ?? "text") as Language };
  }

  const array = Children.toArray(children).filter(child => {
    return !(typeof child === "string" && child.trim() === "");
  });

  if (array.length === 0) {
    return { code: "", lang: (language ?? "text") as Language };
  }

  const first = array[0];
  if (typeof first === "string") {
    return { code: first.trim(), lang: (language ?? "text") as Language };
  }

  if (isValidElement(first)) {
    const className = first.props?.className ?? first.props?.children?.props?.className ?? "";
    const match = className.match(/language-([\w-]+)/);
    const lang = (language ?? match?.[1] ?? "text") as Language;
    const code = getCode(first.props?.children ?? first);
    return { code, lang };
  }

  return { code: getCode(first), lang: (language ?? "text") as Language };
}

function getCode(node: ReactNode): string {
  if (typeof node === "string") return node.trim();
  if (Array.isArray(node)) {
    return node.map(segment => getCode(segment)).join("\n").trim();
  }
  if (isValidElement(node)) {
    return getCode(node.props?.children);
  }
  return "";
}
