import type { ReactElement } from "react";
import {
  mdxInsetClass,
  mdxMutedTextClass,
  mdxPanelClass,
  mdxSubtleTextClass,
} from "./surface";

type FileTreeProps = {
  title?: string;
  caption?: string;
  rootLabel?: string;
  paths: string[];
  highlights?: string[];
};

type FileTreeNode = {
  name: string;
  path: string;
  children: Map<string, FileTreeNode>;
};

export function FileTree({
  title,
  caption,
  rootLabel = "workspace",
  paths,
  highlights = [],
}: FileTreeProps) {
  const tree = buildTree(paths);
  const highlightSet = new Set(highlights);

  return (
    <section className={mdxPanelClass}>
      {(title || caption) ? (
        <div className="space-y-2">
          {title ? <p className={mdxSubtleTextClass}>Project Structure</p> : null}
          {title ? (
            <h3 className="text-xl font-semibold text-slate-950 dark:text-white">
              {title}
            </h3>
          ) : null}
          {caption ? <p className={mdxMutedTextClass}>{caption}</p> : null}
        </div>
      ) : null}

      <div className={`${mdxInsetClass} mt-5 overflow-x-auto px-4 py-4 sm:px-5`}>
        <div className="min-w-[24rem] font-mono text-sm leading-7 text-slate-700 dark:text-slate-200">
          <div className="mb-2 font-semibold text-slate-950 dark:text-white">
            {rootLabel}
          </div>
          <div className="space-y-1">
            {Array.from(tree.children.values()).map((node, index, nodes) =>
              renderNode(node, "", index === nodes.length - 1, highlightSet),
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function buildTree(paths: string[]) {
  const root: FileTreeNode = {
    name: "",
    path: "",
    children: new Map(),
  };

  for (const rawPath of paths) {
    const cleaned = rawPath.trim().replace(/\\/g, "/").replace(/^\/+|\/+$/g, "");
    if (!cleaned) {
      continue;
    }

    const segments = cleaned.split("/");
    let current = root;

    for (let index = 0; index < segments.length; index += 1) {
      const segment = segments[index];
      const currentPath = segments.slice(0, index + 1).join("/");
      const existing = current.children.get(segment);

      if (existing) {
        current = existing;
        continue;
      }

      const next: FileTreeNode = {
        name: segment,
        path: currentPath,
        children: new Map(),
      };

      current.children.set(segment, next);
      current = next;
    }
  }

  return sortNode(root);
}

function sortNode(node: FileTreeNode): FileTreeNode {
  const sortedEntries = Array.from(node.children.entries()).sort((left, right) => {
    const leftIsFolder = left[1].children.size > 0;
    const rightIsFolder = right[1].children.size > 0;

    if (leftIsFolder !== rightIsFolder) {
      return leftIsFolder ? -1 : 1;
    }

    return left[0].localeCompare(right[0]);
  });

  node.children = new Map(sortedEntries.map(([name, child]) => [name, sortNode(child)]));
  return node;
}

function renderNode(
  node: FileTreeNode,
  prefix: string,
  isLast: boolean,
  highlightSet: Set<string>,
): ReactElement {
  const isFolder = node.children.size > 0;
  const branch = `${prefix}${isLast ? "└─ " : "├─ "}`;
  const nextPrefix = `${prefix}${isLast ? "   " : "│  "}`;
  const highlighted = highlightSet.has(node.path);

  return (
    <div key={node.path}>
      <div
        className={`flex items-center gap-3 rounded-xl px-2 py-1 ${
          highlighted
            ? "bg-slate-900 text-white dark:bg-white dark:text-slate-950"
            : ""
        }`}
      >
        <span className={highlighted ? "text-white/80 dark:text-slate-700" : "text-slate-400"}>
          {branch}
        </span>
        <span className={highlighted ? "text-white/80 dark:text-slate-700" : "text-slate-500"}>
          {isFolder ? "DIR" : "FILE"}
        </span>
        <span>{node.name}</span>
      </div>

      {Array.from(node.children.values()).map((child, index, children) =>
        renderNode(child, nextPrefix, index === children.length - 1, highlightSet),
      )}
    </div>
  );
}
