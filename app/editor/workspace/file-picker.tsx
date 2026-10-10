import { useMemo } from "react";
import { getPostFilePath } from "@/utils/shared/post-fields";
import { buildTree, FolderTree } from "./folder-tree";
import { formatUpdatedAt } from "./format";
import type { EditorFeedback, EditorFileOption } from "./types";

const SHORTCUT_LIMIT = 5;

function latestWithStatus(
  files: EditorFileOption[],
  status: EditorFileOption["status"]
) {
  return files
    .filter(file => file.status === status)
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .slice(0, SHORTCUT_LIMIT);
}

export function FilePicker({
  files,
  selectedPath,
  feedback,
  onSelect,
  onClose,
}: {
  files: EditorFileOption[];
  selectedPath: string;
  feedback: EditorFeedback | null;
  onSelect: (path: string) => void;
  onClose: () => void;
}) {
  const recentDrafts = useMemo(() => latestWithStatus(files, "draft"), [files]);
  const archivedPosts = useMemo(
    () => latestWithStatus(files, "archived"),
    [files]
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-[480px] max-w-[90vw] rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-800">
              Select File
            </h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-full border border-slate-200 px-2 py-1 text-xs text-slate-600 hover:bg-slate-100"
          >
            Close
          </button>
        </div>
        <div className="mt-3 max-h-72 overflow-y-auto rounded-md border border-slate-200 bg-slate-50 p-2 text-xs text-slate-700">
          <div className="mb-3 rounded-md border border-slate-200 bg-white p-2">
            <div className="mb-2 flex items-center justify-between gap-2">
              <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                Recent Drafts
              </div>
              <div className="text-[11px] text-slate-400">
                {recentDrafts.length === 0
                  ? "No saved drafts"
                  : `${recentDrafts.length} shown`}
              </div>
            </div>
            {recentDrafts.length === 0 ? (
              <div className="rounded-md border border-dashed border-slate-200 bg-slate-50 px-3 py-2 text-[11px] text-slate-400">
                Save a draft once and it will appear here for one-click restore.
              </div>
            ) : (
              <div className="space-y-2">
                {recentDrafts.map(file => (
                  <button
                    key={`recent-${file.path}`}
                    type="button"
                    onClick={() => onSelect(file.path)}
                    className={`flex w-full items-start justify-between gap-3 rounded-md border px-3 py-2 text-left transition ${
                      file.path === selectedPath
                        ? "border-indigo-400 bg-indigo-50"
                        : "border-slate-200 bg-slate-50 hover:border-indigo-300 hover:bg-indigo-50"
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-[12px] font-semibold text-slate-700">
                          {file.label}
                        </span>
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-900">
                          Draft
                        </span>
                      </div>
                      <div className="mt-1 truncate text-[11px] text-slate-400">
                        Updated {formatUpdatedAt(file.updatedAt)}
                      </div>
                    </div>
                    <span className="shrink-0 text-[11px] text-slate-400">
                      Open
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
          {files.length === 0 ? (
            <div className="text-slate-400">
              No files found. Confirm that{" "}
              {getPostFilePath("YEAR", "slug")} exists.
            </div>
          ) : (
            <FolderTree
              tree={buildTree(files)}
              selectedPath={selectedPath}
              onSelect={onSelect}
            />
          )}
          <div className="mt-3 rounded-md border border-slate-200 bg-white p-2">
            <div className="mb-2 flex items-center justify-between gap-2">
              <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                Archived Posts
              </div>
              <div className="text-[11px] text-slate-400">
                {archivedPosts.length === 0
                  ? "No archived posts"
                  : `${archivedPosts.length} shown`}
              </div>
            </div>
            {archivedPosts.length === 0 ? (
              <div className="rounded-md border border-dashed border-slate-200 bg-slate-50 px-3 py-2 text-[11px] text-slate-400">
                Archived posts stay here for read-only review or restore later.
              </div>
            ) : (
              <div className="space-y-2">
                {archivedPosts.map(file => (
                  <button
                    key={`archived-${file.path}`}
                    type="button"
                    onClick={() => onSelect(file.path)}
                    className={`flex w-full items-start justify-between gap-3 rounded-md border px-3 py-2 text-left transition ${
                      file.path === selectedPath
                        ? "border-indigo-400 bg-indigo-50"
                        : "border-slate-200 bg-slate-50 hover:border-indigo-300 hover:bg-indigo-50"
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-[12px] font-semibold text-slate-700">
                          {file.label}
                        </span>
                        <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-800">
                          Archived
                        </span>
                      </div>
                      <div className="mt-1 truncate text-[11px] text-slate-400">
                        Updated {formatUpdatedAt(file.updatedAt)}
                      </div>
                    </div>
                    <span className="shrink-0 text-[11px] text-slate-400">
                      Open
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        {feedback ? (
          <div
            className={`mt-2 text-[11px] ${
              feedback.tone === "error" ? "text-rose-500" : "text-slate-500"
            }`}
          >
            {feedback.message}
          </div>
        ) : null}
        <div className="mt-2 text-[11px] text-slate-500">
          Draft and archived posts are marked with badges. Only drafts are
          eligible for automatic restore.
        </div>
      </div>
    </div>
  );
}
