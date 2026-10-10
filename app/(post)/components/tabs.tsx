import { Children, isValidElement } from "react";
import type { ReactElement, ReactNode } from "react";
import type { Language } from "prism-react-renderer";
import { Snippet } from "./snippet";
import { mdxEmptyStateClass, mdxInsetClass, mdxMutedTextClass } from "./surface";
import { TabSwitcher, type TabPanel } from "./tab-switcher";

type TabProps = {
  title: string;
  children: ReactNode;
};

type ElementWithChildren = { className?: string; children?: ReactNode };

function isElementWithChildren(node: unknown): node is ReactElement<ElementWithChildren> {
  return isValidElement<ElementWithChildren>(node);
}

// Every panel is rendered here, so code is highlighted before it reaches the
// browser. The switcher that follows only chooses which panel to show.
export function Tabs({
  children,
  defaultIndex = 0,
  caption,
  lineNumbers = false,
}: {
  children: ReactNode;
  defaultIndex?: number;
  caption?: ReactNode;
  lineNumbers?: boolean;
}) {
  const tabs = Children.toArray(children) as ReactElement<TabProps>[];
  const panels = tabs.map(tab => renderPanel(tab, caption, lineNumbers));

  return (
    <TabSwitcher
      panels={panels}
      defaultIndex={defaultIndex}
      caption={caption}
      emptyState={<div className={mdxEmptyStateClass}>No tabs are available in this block.</div>}
    />
  );
}

function renderPanel(
  tab: ReactElement<TabProps>,
  caption: ReactNode,
  lineNumbers: boolean,
): TabPanel {
  const cleanedChildren = cleanChildren(tab.props.children);
  const highlightInfo = findCodeSnippet(cleanedChildren);

  if (!highlightInfo) {
    const content = cleanedChildren.length > 0 ? cleanedChildren : tab.props.children;

    return {
      title: tab.props.title,
      content: <div className={`${mdxInsetClass} p-4 ${mdxMutedTextClass}`}>{content}</div>,
      isSnippet: false,
    };
  }

  const { code, language } = highlightInfo;

  return {
    title: tab.props.title,
    content: (
      <Snippet scroll caption={caption} className="my-0" lineNumbers={lineNumbers}>
        <code className={`language-${language}`}>{code}</code>
      </Snippet>
    ),
    isSnippet: true,
  };
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
