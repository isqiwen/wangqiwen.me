"use client";

import {
  Children,
  ReactElement,
  ReactNode,
  isValidElement,
  useId,
  useMemo,
  useState,
} from "react";
import { Highlight, themes } from "prism-react-renderer";
import type { Language } from "prism-react-renderer";
import { Snippet } from "./snippet";
import { Caption } from "./caption";

type TabProps = {
  title: string;
  children: ReactNode;
};

type ElementWithChildren = { className?: string; children?: ReactNode };

function isElementWithChildren(node: unknown): node is ReactElement<ElementWithChildren> {
  return isValidElement<ElementWithChildren>(node);
}

export function Tabs({
  children,
  defaultIndex = 0,
  caption,
}: {
  children: ReactNode;
  defaultIndex?: number;
  caption?: ReactNode;
}) {
  const tabs = Children.toArray(children) as ReactElement<TabProps>[];
  const [active, setActive] = useState(defaultIndex);
  const id = useId();
  const activeTab = tabs[active];

  const renderedContent = useMemo(() => {
    if (!activeTab) return null;
    const cleanedChildren = cleanChildren(activeTab.props.children);
    const highlightInfo = findCodeSnippet(cleanedChildren);

    if (!highlightInfo) {
      return cleanedChildren.length > 0 ? cleanedChildren : activeTab.props.children;
    }

    const { code, language } = highlightInfo;

    return (
      <Highlight theme={themes.nightOwl} code={code} language={language}>
        {({ className, style, tokens, getLineProps, getTokenProps }) => (
          <pre
            className={`rounded-2xl border border-white/10 bg-[#0b1120] p-4 text-sm text-white ${className}`}
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
    );
  }, [activeTab]);

  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur">
      <div className="flex flex-wrap gap-2">
        {tabs.map((tab, index) => (
          <button
            key={tab.props.title + index}
            onClick={() => setActive(index)}
            className={`rounded-full px-4 py-1.5 text-xs font-semibold tracking-[0.2em] transition ${
              index === active
                ? "bg-gradient-to-r from-indigo-500 to-blue-500 text-white shadow-[0_10px_30px_rgba(79,118,255,0.45)]"
                : "border border-white/10 text-slate-300 hover:border-white/40 hover:text-white"
            }`}
            aria-pressed={index === active}
          >
            {tab.props.title}
          </button>
        ))}
      </div>
      <div
        id={`${id}-panel-${active}`}
        className="mt-4 rounded-2xl border border-white/5 bg-white/5 p-4 text-sm text-slate-200"
      >
        {renderedContent}
      </div>
      {caption ? <Caption>{caption}</Caption> : null}
    </div>
  );
}

export function Tab({ children }: TabProps) {
  return <>{children}</>;
}

function cleanChildren(children: ReactNode): Array<ReactNode> {
  return Children.toArray(children).filter(child => {
    if (typeof child === "string") {
      return child.trim().length > 0;
    }
    return true;
  });
}

function findCodeSnippet(children: ReactNode | ReactNode[]): { code: string; language: Language } | null {
  const nodes = Array.isArray(children) ? children : [children];

  for (const node of nodes) {
    if (!node) continue;

    if (typeof node === "string") {
      continue;
    }

    if (Array.isArray(node)) {
      const result = findCodeSnippet(node);
      if (result) return result;
      continue;
    }

    if (!isElementWithChildren(node)) continue;

    if (node.type === "pre" && node.props?.children) {
      const codeChild = Children.toArray(node.props.children).find(isElementWithChildren);

      if (codeChild) {
        const className = codeChild.props.className ?? "";
        const match = className.match(/language-([\w-]+)/);
        const language = (match?.[1] ?? "text") as Language;
        const codeText = getCodeText(codeChild.props.children);
        if (codeText) {
          return { code: codeText, language };
        }
      }
    } else if (node.type === Snippet || (node.type as { __snippetComponent?: boolean })?.__snippetComponent) {
      const info = extractFromSnippetNode(node);
      if (info) return info;
    }

    const nested = findCodeSnippet(node.props.children);
    if (nested) return nested;
  }

  return null;
}

function getCodeText(value: ReactNode): string {
  if (typeof value === "string") {
    return value.trim();
  }

  if (Array.isArray(value)) {
    return value
      .map(segment => (typeof segment === "string" ? segment : getCodeText(segment)))
      .join("\n")
      .trim();
  }

  if (isElementWithChildren(value)) {
    return getCodeText(value.props.children ?? "");
  }

  return "";
}

function extractFromSnippetNode(
  node: ReactElement<ElementWithChildren>,
): { code: string; language: Language } | null {
  const childArray = Children.toArray(node.props.children ?? []).filter(Boolean);
  const primaryChild = childArray[0];

  let className = node.props.className ?? "";
  let contentSource: ReactNode = node.props.children;

  if (primaryChild && isElementWithChildren(primaryChild)) {
    className = primaryChild.props.className ?? className;
    contentSource = primaryChild.props.children ?? primaryChild;
  }

  const match = className.match(/language-([\w-]+)/);
  const language = (match?.[1] ?? "text") as Language;
  const code = getCodeText(contentSource);
  if (!code) return null;
  return { code, language };
}
