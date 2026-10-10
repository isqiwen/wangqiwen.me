import { useState } from "react";
import { isEditorChanges, readResponseError } from "./api";
import type { ChangesView, EditorChanges, ShowFeedback } from "./types";

export function useChanges({
  activePath,
  mdxContent,
  showFeedback,
}: {
  activePath: string | null;
  mdxContent: string;
  showFeedback: ShowFeedback;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [changes, setChanges] = useState<EditorChanges | null>(null);
  const [view, setView] = useState<ChangesView>("saved");
  const [isLoading, setIsLoading] = useState(false);

  async function open() {
    if (!activePath) {
      showFeedback("Save this document once before comparing changes.", "info");
      return;
    }

    setIsOpen(true);
    setChanges(null);
    setView("saved");
    setIsLoading(true);

    try {
      const res = await fetch("/api/editor/changes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: activePath, content: mdxContent }),
      });

      if (!res.ok) {
        throw new Error(
          await readResponseError(res, "Failed to compare post changes.")
        );
      }

      const data = (await res.json()) as Partial<EditorChanges>;
      if (!isEditorChanges(data)) {
        throw new Error("The change comparison returned an invalid response.");
      }

      setChanges(data);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to compare post changes.";
      setIsOpen(false);
      showFeedback(message, "error");
    } finally {
      setIsLoading(false);
    }
  }

  return {
    isOpen,
    changes,
    view,
    isLoading,
    open,
    close: () => setIsOpen(false),
    setView,
  };
}
