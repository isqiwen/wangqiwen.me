import type { EditorStatus } from "./types";

type EditorToolbarProps = {
  status: EditorStatus;
  activePath: string | null;
  canOpenPreview: boolean;
  previewHref: string;
  isBusy: boolean;
  hasConflict: boolean;
  isReady: boolean;
  onOpenChanges: () => void;
  onSave: () => void;
  onPublish: () => void;
  onMoveToDraft: () => void;
  onArchive: () => void;
  onDelete: () => void;
  onNewDraft: () => void;
  onOpenPicker: () => void;
};

export function EditorToolbar({
  status: currentStatus,
  activePath,
  canOpenPreview,
  previewHref,
  isBusy,
  hasConflict,
  isReady,
  onOpenChanges,
  onSave,
  onPublish,
  onMoveToDraft,
  onArchive,
  onDelete,
  onNewDraft,
  onOpenPicker,
}: EditorToolbarProps) {
  // Lifecycle actions wait for the first load, a running request and an
  // unresolved save conflict.
  const isLifecycleDisabled = isBusy || hasConflict || !isReady;

  return (
    <header className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">MDX Editor</h1>
        <p className="text-sm text-slate-500">
          Save changes locally. Publishing marks an article for the next
          deployment; it does not deploy to the VPS.
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        {canOpenPreview ? (
          <a
            href={previewHref}
            target="_blank"
            rel="noreferrer"
            className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            {currentStatus === "published" ? "Open Post" : "Open Preview"}
          </a>
        ) : null}
        <button
          type="button"
          onClick={onOpenChanges}
          disabled={!activePath}
          title={
            activePath
              ? "Compare editor, saved, and Git versions"
              : "Save this document once before comparing changes"
          }
          className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:border-slate-100 disabled:text-slate-300"
        >
          Changes
        </button>
        {currentStatus !== "archived" ? (
          <button
            onClick={onSave}
            disabled={isLifecycleDisabled}
            className="rounded-full bg-gray-900 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-gray-700"
          >
            {currentStatus === "draft"
              ? "Save Draft"
              : "Save Published Changes"}
          </button>
        ) : null}
        {currentStatus === "draft" ? (
          <button
            onClick={onPublish}
            disabled={isLifecycleDisabled}
            className="rounded-full bg-gray-900 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-gray-700"
          >
            Publish Post
          </button>
        ) : null}
        {currentStatus === "published" ? (
          <button
            onClick={onMoveToDraft}
            disabled={isLifecycleDisabled}
            className="rounded-full border border-sky-300 bg-sky-50 px-4 py-2 text-sm font-semibold text-sky-900 hover:bg-sky-100"
          >
            Move To Draft
          </button>
        ) : null}
        {currentStatus === "published" ? (
          <button
            onClick={onArchive}
            disabled={isLifecycleDisabled}
            className="rounded-full border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-900 hover:bg-amber-100"
          >
            Archive Post
          </button>
        ) : null}
        {currentStatus === "archived" ? (
          <button
            onClick={onMoveToDraft}
            disabled={isLifecycleDisabled}
            className="rounded-full border border-sky-300 bg-sky-50 px-4 py-2 text-sm font-semibold text-sky-900 hover:bg-sky-100"
          >
            Restore To Draft
          </button>
        ) : null}
        {(currentStatus === "draft" || currentStatus === "archived") &&
        activePath ? (
          <button
            onClick={onDelete}
            disabled={isLifecycleDisabled}
            className="rounded-full border border-rose-300 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-900 hover:bg-rose-100"
          >
            {currentStatus === "archived"
              ? "Delete Permanently"
              : "Delete Draft"}
          </button>
        ) : null}
        <button
          onClick={onNewDraft}
          disabled={isBusy || !isReady}
          className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          New Draft
        </button>
        <button
          onClick={onOpenPicker}
          disabled={isBusy || !isReady}
          className="rounded-full bg-gray-900 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-gray-700"
        >
          Load
        </button>
      </div>
    </header>
  );
}
