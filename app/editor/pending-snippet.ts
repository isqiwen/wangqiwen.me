export const PENDING_EDITOR_SNIPPET_KEY = "mdx-editor.pending-snippet.v1";
const PENDING_EDITOR_SNIPPET_VERSION = 1;
const MAX_PENDING_SNIPPET_AGE_MS = 1000 * 60 * 15;

export type PendingEditorSnippet = {
  version: 1;
  snippet: string;
  createdAt: number;
};

export function createPendingEditorSnippet(snippet: string): PendingEditorSnippet {
  return {
    version: PENDING_EDITOR_SNIPPET_VERSION,
    snippet,
    createdAt: Date.now(),
  };
}

export function parsePendingEditorSnippet(rawValue: string | null): PendingEditorSnippet | null {
  if (!rawValue) {
    return null;
  }

  try {
    const parsed = JSON.parse(rawValue) as Partial<PendingEditorSnippet>;
    if (
      parsed.version !== PENDING_EDITOR_SNIPPET_VERSION ||
      typeof parsed.snippet !== "string" ||
      parsed.snippet.trim().length === 0 ||
      typeof parsed.createdAt !== "number"
    ) {
      return null;
    }

    if (Date.now() - parsed.createdAt > MAX_PENDING_SNIPPET_AGE_MS) {
      return null;
    }

    return {
      version: PENDING_EDITOR_SNIPPET_VERSION,
      snippet: parsed.snippet,
      createdAt: parsed.createdAt,
    };
  } catch {
    return null;
  }
}
