import { useState } from "react";
import type { EditorFileOption, EditorStatus } from "./types";

type TreeNode = {
  name: string;
  path?: string;
  status?: EditorStatus;
  children?: TreeNode[];
};

function getOrCreate(nodes: TreeNode[], name: string): TreeNode {
  let node = nodes.find(item => item.name === name);
  if (!node) {
    node = { name, children: [] };
    nodes.push(node);
  }
  return node;
}

export function buildTree(files: EditorFileOption[]): TreeNode[] {
  const root: TreeNode[] = [];

  for (const file of files) {
    const parts = file.label.split("/");
    if (parts.length < 2) continue;

    const [year, slug] = parts;
    const yearNode = getOrCreate(root, year);
    const slugNode = getOrCreate(yearNode.children!, slug);
    slugNode.path = file.path;
    slugNode.status = file.status;
  }

  return root;
}

export function FolderTree({
  tree,
  selectedPath,
  onSelect,
}: {
  tree: TreeNode[];
  selectedPath: string;
  onSelect: (path: string) => void;
}) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  function toggleYear(key: string) {
    setExpanded(prev => ({ ...prev, [key]: !prev[key] }));
  }

  return (
    <div className="space-y-1">
      {tree.map(yearNode => {
        const yearKey = yearNode.name;
        const isYearOpen = Boolean(expanded[yearKey]);

        return (
          <div
            key={yearKey}
            className="rounded-md border border-slate-200 bg-white p-2"
          >
            <button
              type="button"
              onClick={() => toggleYear(yearKey)}
              className="flex w-full items-center justify-between text-left font-semibold text-slate-700"
            >
              <span>{yearNode.name}</span>
              <span className="text-[11px] text-slate-500">
                {isYearOpen ? "Collapse" : "Expand"}
              </span>
            </button>

            {isYearOpen ? (
              <div className="mt-1 space-y-1 pl-2">
                {yearNode.children?.map(slugNode => (
                  <div
                    key={`${yearKey}/${slugNode.name}`}
                    className="rounded-md border border-slate-100 bg-white/60 p-1"
                  >
                    <button
                      type="button"
                      onClick={() => slugNode.path && onSelect(slugNode.path)}
                      className={`flex w-full items-center justify-between gap-2 rounded border px-2 py-1 text-left text-[12px] transition ${
                        slugNode.path === selectedPath
                          ? "border-indigo-400 bg-indigo-50 text-indigo-700"
                          : "border-slate-200 bg-white text-slate-700 hover:border-indigo-300 hover:bg-indigo-50"
                      }`}
                    >
                      <span>{slugNode.name}</span>
                      {slugNode.status === "archived" ? (
                        <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-800">
                          Archived
                        </span>
                      ) : slugNode.status === "draft" ? (
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-900">
                          Draft
                        </span>
                      ) : null}
                    </button>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
