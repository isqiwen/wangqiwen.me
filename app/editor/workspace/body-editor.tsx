import { useRef } from "react";
import type {
  ChangeEvent,
  ClipboardEvent,
  DragEvent,
  KeyboardEvent,
  RefObject,
  SyntheticEvent,
} from "react";
import { MDX_FORMATTING_ACTIONS } from "./mdx-formatting";
import { MdxSyntaxHighlight } from "./mdx-syntax-highlight";
import type { MdxFormattingAction } from "./types";

type BodyEditorProps = {
  body: string;
  // May lag behind `body` so highlighting never blocks typing.
  highlightedBody: string;
  editorRef: RefObject<HTMLTextAreaElement | null>;
  isReadOnly: boolean;
  isUploading: boolean;
  onBodyChange: (body: string, start: number, end: number) => void;
  onSelectionChange: (start: number, end: number) => void;
  onFormat: (action: MdxFormattingAction) => void;
  onImageFile: (file: File) => void;
};

export function BodyEditor({
  body,
  highlightedBody,
  editorRef,
  isReadOnly,
  isUploading,
  onBodyChange,
  onSelectionChange,
  onFormat,
  onImageFile,
}: BodyEditorProps) {
  const highlightedEditorRef = useRef<HTMLPreElement | null>(null);

  function handleChange(event: ChangeEvent<HTMLTextAreaElement>) {
    const { value, selectionStart, selectionEnd } = event.target;
    onBodyChange(
      value,
      selectionStart ?? value.length,
      selectionEnd ?? value.length
    );
  }

  function handleSelect(event: SyntheticEvent<HTMLTextAreaElement>) {
    const target = event.target as HTMLTextAreaElement;
    onSelectionChange(target.selectionStart ?? 0, target.selectionEnd ?? 0);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (isReadOnly || (!event.metaKey && !event.ctrlKey) || event.altKey) {
      return;
    }

    const key = event.key.toLowerCase();
    if (key === "b") {
      event.preventDefault();
      event.stopPropagation();
      onFormat("bold");
    } else if (key === "k") {
      event.preventDefault();
      event.stopPropagation();
      onFormat("link");
    }
  }

  function handleDrop(event: DragEvent<HTMLTextAreaElement>) {
    if (isReadOnly) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    const files = Array.from(event.dataTransfer?.files ?? []);
    if (files.length > 0) {
      onImageFile(files[0]);
    }
  }

  function handlePaste(event: ClipboardEvent<HTMLTextAreaElement>) {
    if (isReadOnly) {
      return;
    }

    const files = Array.from(event.clipboardData?.files ?? []);
    const imageFile = files.find(file => file.type.startsWith("image/"));
    if (imageFile) {
      event.preventDefault();
      onImageFile(imageFile);
    }
  }

  return (
    <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <label
            htmlFor="editor-body"
            className="text-xs font-semibold text-slate-600"
          >
            Body (MDX)
          </label>
          {isUploading ? (
            <span className="text-xs text-slate-400">Uploading image...</span>
          ) : null}
        </div>
        <div
          className="flex flex-wrap gap-1.5"
          role="toolbar"
          aria-label="MDX formatting"
        >
          {MDX_FORMATTING_ACTIONS.map(formattingAction => (
            <button
              key={formattingAction.action}
              type="button"
              onMouseDown={event => event.preventDefault()}
              onClick={() => onFormat(formattingAction.action)}
              disabled={isReadOnly}
              title={formattingAction.shortcut}
              className="rounded-full border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:border-slate-100 disabled:text-slate-300"
            >
              {formattingAction.label}
            </button>
          ))}
        </div>
      </div>
      <div className="grid min-h-[800px] overflow-hidden rounded-md border border-slate-200 bg-slate-50">
        <MdxSyntaxHighlight
          source={highlightedBody}
          scrollRef={highlightedEditorRef}
        />
        <textarea
          id="editor-body"
          ref={editorRef}
          value={body}
          onChange={handleChange}
          onSelect={handleSelect}
          onScroll={event => {
            const highlightedEditor = highlightedEditorRef.current;
            if (highlightedEditor) {
              highlightedEditor.scrollTop = event.currentTarget.scrollTop;
              highlightedEditor.scrollLeft = event.currentTarget.scrollLeft;
            }
          }}
          onKeyDown={handleKeyDown}
          onDrop={handleDrop}
          onDragOver={event => event.preventDefault()}
          onPaste={handlePaste}
          className="col-start-1 row-start-1 min-h-[800px] w-full resize-y rounded-md bg-transparent px-3 py-2 font-mono text-sm leading-6 text-transparent caret-slate-900 outline-none selection:bg-sky-200/80 selection:text-transparent disabled:cursor-not-allowed disabled:bg-slate-100"
          spellCheck={false}
          disabled={isReadOnly}
        />
      </div>
    </div>
  );
}
