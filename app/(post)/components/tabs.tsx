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
import type { Language } from "prism-react-renderer";
import { Snippet } from "./snippet";
import { Caption } from "./caption";
import {
  mdxEmptyStateClass,
  mdxInsetClass,
  mdxMutedTextClass,
  mdxPanelClass,
  mdxPillButtonClass,
} from "./surface";

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

  const renderedState = useMemo(() => {
    if (!activeTab) {
      return {
        content: <div className={mdxEmptyStateClass}>No tabs are available in this block.</div>,
        isSnippet: false,
      };
    }

    const cleanedChildren = cleanChildren(activeTab.props.children);
    const highlightInfo = findCodeSnippet(cleanedChildren);

    if (!highlightInfo) {
      const content =
        cleanedChildren.length > 0 ? cleanedChildren : activeTab.props.children;

      return {
        content: <div className={`${mdxInsetClass} p-4 ${mdxMutedTextClass}`}>{content}</div>,
        isSnippet: false,
      };
    }

    const { code, language } = highlightInfo;

    return {
      content: (
        <Snippet scroll caption={caption} className="my-0">
          <code className={`language-${language}`}>{code}</code>
        </Snippet>
      ),
      isSnippet: true,
    };
  }, [activeTab, caption]);

  return (
    <div className={`${mdxPanelClass} w-full space-y-3`}>
      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Code or content tabs">
        {tabs.map((tab, index) => (
          <button
            key={tab.props.title + index}
            type="button"
            onClick={() => setActive(index)}
            className={mdxPillButtonClass(index === active)}
            role="tab"
            aria-selected={index === active}
            aria-controls={`${id}-panel-${index}`}
            id={`${id}-tab-${index}`}
          >
            {tab.props.title}
          </button>
        ))}
      </div>
      <div
        id={`${id}-panel-${active}`}
        role="tabpanel"
        aria-labelledby={`${id}-tab-${active}`}
        className="w-full"
      >
        {renderedState.content}
      </div>
      {!renderedState.isSnippet && caption ? <Caption className="mt-1">{caption}</Caption> : null}
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
