import { useCallback, useRef, useState } from "react";
import type { EditorConfirmation, RequestConfirmation } from "./types";

// One confirmation at a time: a request made while another is open resolves
// to "not confirmed" instead of replacing the dialog the author is reading.
export function useConfirmation() {
  const [confirmation, setConfirmation] = useState<EditorConfirmation | null>(
    null
  );
  const resolveRef = useRef<((confirmed: boolean) => void) | null>(null);

  const requestConfirmation = useCallback<RequestConfirmation>(
    nextConfirmation => {
      if (resolveRef.current) return Promise.resolve(false);
      return new Promise<boolean>(resolve => {
        resolveRef.current = resolve;
        setConfirmation(nextConfirmation);
      });
    },
    []
  );

  const resolveConfirmation = useCallback((confirmed: boolean) => {
    resolveRef.current?.(confirmed);
    resolveRef.current = null;
    setConfirmation(null);
  }, []);

  return { confirmation, requestConfirmation, resolveConfirmation };
}
