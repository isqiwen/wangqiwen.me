import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import {
  parsePendingEditorSnippet,
  PENDING_EDITOR_SNIPPET_KEY,
} from "../pending-snippet";
import type { ComponentSnippetInsert } from "../snippets";
import { formatMdxSelection } from "./mdx-formatting";
import type {
  EditorOutlineHeading,
  MdxFormattingAction,
  ShowFeedback,
} from "./types";

// The textarea and the last selection React knows about. The stored selection
// is only a fallback for the moments the textarea itself cannot be asked.
export function useEditorSelection(initialPosition: number) {
  const editorRef = useRef<HTMLTextAreaElement | null>(null);
  const [cursorPos, setCursorPos] = useState(initialPosition);
  const [selectionRange, setSelectionRange] = useState({
    start: initialPosition,
    end: initialPosition,
  });

  const select = useCallback((start: number, end: number) => {
    setCursorPos(start);
    setSelectionRange({ start, end });
  }, []);

  const moveCursor = useCallback(
    (position: number) => select(position, position),
    [select]
  );

  const clampCursor = useCallback((maximum: number) => {
    setCursorPos(current => Math.min(current, maximum));
  }, []);

  // A selection to apply once React has written `value` to the textarea.
  const pendingSelectionRef = useRef<{
    value: string;
    start: number;
    end: number;
  } | null>(null);

  const applyPendingSelection = useCallback(() => {
    const pending = pendingSelectionRef.current;
    const textarea = editorRef.current;
    if (!pending || !textarea || textarea.value !== pending.value) {
      return;
    }

    pendingSelectionRef.current = null;
    textarea.focus();
    textarea.setSelectionRange(pending.start, pending.end);
  }, []);

  // Runs in the commit that writes the new body, so the selection is final
  // before the browser handles another event. Restoring it a frame later left
  // a window in which the next input replaced the wrong range.
  useLayoutEffect(applyPendingSelection);

  const selectAfterUpdate = useCallback(
    (value: string, start: number, end: number) => {
      pendingSelectionRef.current = { value, start, end };
      // Nothing will commit if the textarea already shows this value.
      applyPendingSelection();
    },
    [applyPendingSelection]
  );

  return {
    editorRef,
    cursorPos,
    selectionRange,
    setCursorPos,
    setSelectionRange,
    select,
    moveCursor,
    clampCursor,
    selectAfterUpdate,
  };
}

export type EditorSelection = ReturnType<typeof useEditorSelection>;

export function useBodyEditing({
  selection,
  body,
  setBody,
  isReadOnly,
  isReady,
  showFeedback,
}: {
  selection: EditorSelection;
  body: string;
  setBody: (body: string) => void;
  isReadOnly: boolean;
  isReady: boolean;
  showFeedback: ShowFeedback;
}) {
  const {
    editorRef,
    cursorPos,
    selectionRange,
    setCursorPos,
    setSelectionRange,
    moveCursor,
    selectAfterUpdate,
  } = selection;
  const handledPendingSnippetRef = useRef<number | null>(null);

  const insertSnippet = useCallback(
    (snippet: string | ComponentSnippetInsert) => {
      if (isReadOnly) {
        return;
      }

      const resolvedSnippet =
        typeof snippet === "string"
          ? {
              content: snippet,
              selectionStart: null,
              selectionEnd: null,
            }
          : snippet;
      const el = editorRef.current;
      const pos = el?.selectionStart ?? cursorPos ?? body.length;
      const before = body.slice(0, pos);
      const after = body.slice(pos);
      const needsPrefix = before.length > 0 && !before.endsWith("\n\n");
      const prefix = needsPrefix ? "\n\n" : "";
      const suffix = after.startsWith("\n") ? "" : "\n\n";
      const next = `${before}${prefix}${resolvedSnippet.content}${suffix}${after}`;
      setBody(next);
      const insertStart = (before + prefix).length;
      const fallbackCursor = insertStart + resolvedSnippet.content.length;
      const selectionStart =
        resolvedSnippet.selectionStart == null
          ? fallbackCursor
          : insertStart + resolvedSnippet.selectionStart;
      const selectionEnd =
        resolvedSnippet.selectionEnd == null
          ? selectionStart
          : insertStart + resolvedSnippet.selectionEnd;
      setCursorPos(selectionEnd);
      selectAfterUpdate(next, selectionStart, selectionEnd);
    },
    [
      body,
      cursorPos,
      editorRef,
      isReadOnly,
      selectAfterUpdate,
      setBody,
      setCursorPos,
    ]
  );

  const applyMdxFormatting = useCallback(
    (action: MdxFormattingAction) => {
      if (isReadOnly) {
        return;
      }

      const textarea = editorRef.current;
      const start = textarea?.selectionStart ?? selectionRange.start;
      const end = textarea?.selectionEnd ?? selectionRange.end;
      const next = formatMdxSelection(
        textarea?.value ?? body,
        start,
        end,
        action
      );

      setBody(next.source);
      setCursorPos(next.selectionEnd);
      setSelectionRange({
        start: next.selectionStart,
        end: next.selectionEnd,
      });
      selectAfterUpdate(next.source, next.selectionStart, next.selectionEnd);
    },
    [
      body,
      editorRef,
      isReadOnly,
      selectAfterUpdate,
      selectionRange,
      setBody,
      setCursorPos,
      setSelectionRange,
    ]
  );

  const jumpToOutlineHeading = useCallback(
    (heading: EditorOutlineHeading) => {
      const textarea = editorRef.current;
      if (!textarea) {
        return;
      }

      textarea.focus();
      textarea.setSelectionRange(heading.position, heading.position);
      textarea.scrollTop = Math.max(0, (heading.line - 3) * 24);
      moveCursor(heading.position);
    },
    [editorRef, moveCursor]
  );

  // The component guide queues a snippet in localStorage; it may already be
  // waiting when the editor opens or arrive later from another tab.
  const consumePendingEditorSnippet = useCallback(
    (rawValue: string | null) => {
      const pendingSnippet = parsePendingEditorSnippet(rawValue);
      if (
        !pendingSnippet ||
        handledPendingSnippetRef.current === pendingSnippet.createdAt
      ) {
        return;
      }

      handledPendingSnippetRef.current = pendingSnippet.createdAt;
      window.localStorage.removeItem(PENDING_EDITOR_SNIPPET_KEY);

      if (isReadOnly) {
        showFeedback(
          "The current post is read-only, so the queued component snippet was not inserted.",
          "error"
        );
        return;
      }

      insertSnippet(pendingSnippet.snippet);
      showFeedback("Inserted component snippet from the guide.", "success");
    },
    [insertSnippet, isReadOnly, showFeedback]
  );

  useEffect(() => {
    if (!isReady) {
      return;
    }

    consumePendingEditorSnippet(
      window.localStorage.getItem(PENDING_EDITOR_SNIPPET_KEY)
    );
  }, [consumePendingEditorSnippet, isReady]);

  useEffect(() => {
    if (!isReady) {
      return;
    }

    const handleStorage = (event: StorageEvent) => {
      if (event.key !== PENDING_EDITOR_SNIPPET_KEY) {
        return;
      }

      consumePendingEditorSnippet(event.newValue);
    };

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [consumePendingEditorSnippet, isReady]);

  return { insertSnippet, applyMdxFormatting, jumpToOutlineHeading };
}
