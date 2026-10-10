import type { EditorChanges, EditorChangeSet } from "./types";

export function isEditorChanges(
  value: Partial<EditorChanges>
): value is EditorChanges {
  return isEditorChangeSet(value.saved) && isEditorChangeSet(value.git);
}

function isEditorChangeSet(value: unknown): value is EditorChangeSet {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<EditorChangeSet>;
  return (
    typeof candidate.available === "boolean" &&
    typeof candidate.diff === "string"
  );
}

export async function readResponseError(
  response: Response,
  fallbackMessage: string
) {
  try {
    const payload = await response.clone().json();
    return resolveApiError(payload, fallbackMessage);
  } catch {
    return fallbackMessage;
  }
}

export function resolveApiError(payload: unknown, fallbackMessage: string) {
  if (!payload || typeof payload !== "object") {
    return fallbackMessage;
  }

  const candidate = payload as {
    error?: string | { message?: string };
    message?: string;
  };

  if (typeof candidate.error === "string" && candidate.error.trim()) {
    return candidate.error;
  }

  if (
    candidate.error &&
    typeof candidate.error === "object" &&
    typeof candidate.error.message === "string" &&
    candidate.error.message.trim()
  ) {
    return candidate.error.message;
  }

  if (typeof candidate.message === "string" && candidate.message.trim()) {
    return candidate.message;
  }

  return fallbackMessage;
}
