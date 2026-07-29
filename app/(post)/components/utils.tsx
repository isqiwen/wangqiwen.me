import {
  Children,
  cloneElement,
  isValidElement,
  type ReactElement,
  type ReactNode,
} from "react";

const MANUAL_HEADING_ID = /\s*\[#([^\]]+)\]\s*$/;

export function getHeadingData(children: ReactNode, explicitId?: string) {
  const text = getTextContent(children).trim();
  const manualId = text.match(MANUAL_HEADING_ID)?.[1];
  const id = explicitId || manualId || slugifyHeading(text);

  return {
    id,
    title: text.replace(MANUAL_HEADING_ID, "").trim(),
    children: manualId ? removeManualHeadingId(children) : children,
  };
}

export function withHeadingAnchor(children: ReactNode, id: string) {
  return (
    <span className="relative">
      <a
        aria-label={`Link to ${getTextContent(children).trim()}`}
        className={`
          absolute
          px-3
          -left-[2rem]
          invisible
          [span:hover_&]:visible
          font-mono
          font-normal
          text-gray-400
          hover:text-gray-600
          dark:text-gray-500
          dark:hover:text-gray-400
        `}
        data-heading-anchor="true"
        href={`#${id}`}
      >
        #
      </a>
      {children}
    </span>
  );
}

function getTextContent(children: ReactNode): string {
  return Children.toArray(children)
    .map(child => {
      if (typeof child === "string" || typeof child === "number") {
        return String(child);
      }

      if (!isValidElement(child)) {
        return "";
      }

      return getTextContent((child.props as { children?: ReactNode }).children);
    })
    .join("");
}

function removeManualHeadingId(children: ReactNode): ReactNode {
  return stripManualHeadingId(children).children;
}

function stripManualHeadingId(children: ReactNode): {
  children: ReactNode;
  removed: boolean;
} {
  let removed = false;
  const nodes = Children.toArray(children);

  for (let index = nodes.length - 1; index >= 0 && !removed; index -= 1) {
    const child = nodes[index];

    if (typeof child === "string") {
      const nextChild = child.replace(MANUAL_HEADING_ID, "");
      if (nextChild !== child) {
        nodes[index] = nextChild;
        removed = true;
      }
      continue;
    }

    if (isValidElement(child)) {
      const element = child as ReactElement<{ children?: ReactNode }>;
      const result = stripManualHeadingId(element.props.children);

      if (result.removed) {
        nodes[index] = cloneElement(element, undefined, result.children);
        removed = true;
      }
    }
  }

  return {
    children: removed ? nodes : children,
    removed,
  };
}

function slugifyHeading(value: string): string {
  const withoutManualId = value.replace(MANUAL_HEADING_ID, "");

  return (
    withoutManualId
      .normalize("NFKC")
      .toLowerCase()
      .replace(/['’`]/g, "")
      .replace(/[^\p{Letter}\p{Number}]+/gu, "-")
      .replace(/^-+|-+$/g, "") || "section"
  );
}
