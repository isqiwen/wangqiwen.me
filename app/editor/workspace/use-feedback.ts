import { useCallback, useEffect, useState } from "react";
import type { EditorFeedback, ShowFeedback } from "./types";

const FEEDBACK_VISIBLE_MS = 2200;

export function useFeedback() {
  const [feedback, setFeedback] = useState<EditorFeedback | null>(null);

  const showFeedback = useCallback<ShowFeedback>((message, tone = "info") => {
    setFeedback({ message, tone });
  }, []);

  useEffect(() => {
    if (!feedback) return;
    const timer = setTimeout(() => setFeedback(null), FEEDBACK_VISIBLE_MS);
    return () => clearTimeout(timer);
  }, [feedback]);

  return { feedback, showFeedback };
}
