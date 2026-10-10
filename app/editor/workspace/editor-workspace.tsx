"use client";

import { useDeferredValue } from "react";
import { SaveConflictPanel } from "../save-conflict";
import { AssetsPanel } from "./assets-panel";
import { BodyEditor } from "./body-editor";
import { ChangesDialog } from "./changes-dialog";
import { ComponentPalette } from "./component-palette";
import { ConfirmationDialog } from "./confirmation-dialog";
import { EMPTY_DOCUMENT_BODY } from "./document";
import { FilePicker } from "./file-picker";
import { MetadataForm } from "./metadata-form";
import { OutlinePanel } from "./outline-panel";
import { EditorToolbar } from "./toolbar";
import { useAssets } from "./use-assets";
import { useBodyEditing, useEditorSelection } from "./use-body-editing";
import { useChanges } from "./use-changes";
import { useConfirmation } from "./use-confirmation";
import { useEditorWorkspace } from "./use-editor-workspace";
import { useFeedback } from "./use-feedback";

// Composition only: each hook owns one concern and each section renders one
// region. The document lifecycle itself lives in useEditorWorkspace.
export function EditorWorkspace() {
  const { feedback, showFeedback } = useFeedback();
  const { confirmation, requestConfirmation, resolveConfirmation } =
    useConfirmation();
  const selection = useEditorSelection(EMPTY_DOCUMENT_BODY.length);
  const workspace = useEditorWorkspace({
    showFeedback,
    requestConfirmation,
    onDocumentReplaced: selection.moveCursor,
  });
  const { editorDocument, isReadOnly, conflict, mdxContent } = workspace;
  const editing = useBodyEditing({
    selection,
    body: editorDocument.body,
    setBody: workspace.setBody,
    isReadOnly,
    isReady: workspace.initialLoadComplete,
    showFeedback,
  });
  const assets = useAssets({
    postId: editorDocument.id,
    body: editorDocument.body,
    setBody: workspace.setBody,
    isReadOnly,
    insertSnippet: editing.insertSnippet,
    clampCursor: selection.clampCursor,
    showFeedback,
    requestConfirmation,
  });
  const changes = useChanges({
    activePath: workspace.activePath,
    mdxContent,
    showFeedback,
  });
  const highlightedBody = useDeferredValue(editorDocument.body);
  const isBusy = Boolean(workspace.activity);

  return (
    <main
      aria-busy={!workspace.initialLoadComplete}
      className="flex w-screen max-w-none flex-col gap-6 px-4 py-8 lg:px-6"
      style={{ marginLeft: "calc(50% - 50vw)" }}
    >
      <EditorToolbar
        status={editorDocument.status}
        activePath={workspace.activePath}
        canOpenPreview={workspace.canOpenPreview}
        previewHref={workspace.previewHref}
        isBusy={isBusy}
        hasConflict={Boolean(conflict)}
        isReady={workspace.initialLoadComplete}
        onOpenChanges={() => void changes.open()}
        onSave={() => void workspace.saveFile()}
        onPublish={() => void workspace.publishPost()}
        onMoveToDraft={() => void workspace.moveToDraft()}
        onArchive={() => void workspace.archivePost()}
        onDelete={() => void workspace.deleteCurrentPost()}
        onNewDraft={() => void workspace.startNewDraft()}
        onOpenPicker={workspace.openPicker}
      />

      {conflict ? (
        <SaveConflictPanel
          key={conflict.path}
          conflict={conflict}
          content={mdxContent}
          busy={isBusy}
          onReload={() => void workspace.loadFromPath(conflict.path)}
          onCopy={workspace.keepConflictAsDraft}
        />
      ) : null}

      <MetadataForm
        value={editorDocument}
        onChange={workspace.updateField}
        onToggleTopic={workspace.toggleTopic}
        isReadOnly={isReadOnly}
        targetPath={workspace.targetPath}
        readingTimeEstimate={workspace.readingTimeEstimate}
        isSaving={
          workspace.activity === "save" || workspace.activity === "transition"
        }
        isDirty={workspace.isDirty}
        localAutosaveAt={workspace.localAutosaveAt}
        canOpenPreview={workspace.canOpenPreview}
      />

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-[1.4fr_1fr]">
        <BodyEditor
          body={editorDocument.body}
          highlightedBody={highlightedBody}
          editorRef={selection.editorRef}
          isReadOnly={isReadOnly}
          isUploading={assets.isUploading}
          onBodyChange={(body, start, end) => {
            workspace.setBody(body);
            selection.select(start, end);
          }}
          onSelectionChange={selection.select}
          onFormat={editing.applyMdxFormatting}
          onImageFile={file => void assets.uploadImage(file)}
        />

        <div className="space-y-4">
          <OutlinePanel
            body={editorDocument.body}
            onJump={editing.jumpToOutlineHeading}
          />

          <AssetsPanel
            folderId={assets.folderId}
            assets={assets.assets}
            isLoading={assets.isLoading}
            isUploading={assets.isUploading}
            deletingPath={assets.deletingPath}
            isReadOnly={isReadOnly}
            onUpload={file => void assets.uploadImage(file)}
            onRefresh={() => void assets.refresh()}
            onInsert={assets.insert}
            onCopyPath={assetPath => void assets.copyPath(assetPath)}
            onDelete={asset => void assets.remove(asset)}
          />

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-700">
              Component Library
            </h2>
            <ComponentPalette
              onInsert={editing.insertSnippet}
              disabled={isReadOnly}
            />
          </div>
        </div>
      </section>

      {feedback ? (
        <div className="pointer-events-none fixed top-4 right-4 z-40 space-y-2">
          <div
            className={`rounded-md border px-3 py-2 text-xs shadow-lg ${
              feedback.tone === "error"
                ? "border-rose-200 bg-rose-50 text-rose-800"
                : feedback.tone === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border-slate-200 bg-white text-slate-700"
            }`}
          >
            {feedback.message}
          </div>
        </div>
      ) : null}

      {workspace.showPicker ? (
        <FilePicker
          files={workspace.fileOptions}
          selectedPath={workspace.selectedPath}
          feedback={workspace.pickerFeedback}
          onSelect={path => void workspace.loadFromPath(path)}
          onClose={workspace.closePicker}
        />
      ) : null}

      {confirmation ? (
        <ConfirmationDialog
          confirmation={confirmation}
          onCancel={() => resolveConfirmation(false)}
          onConfirm={() => resolveConfirmation(true)}
        />
      ) : null}

      {changes.isOpen ? (
        <ChangesDialog
          changes={changes.changes}
          view={changes.view}
          isLoading={changes.isLoading}
          onClose={changes.close}
          onViewChange={changes.setView}
        />
      ) : null}

      <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-600 shadow-sm">
        <div className="font-semibold text-slate-700">
          Current Metadata Preview
        </div>
        <pre className="mt-2 overflow-x-auto whitespace-pre-wrap">
          {mdxContent.split("\n\n")[0]}
        </pre>
      </section>
    </main>
  );
}
