import { createHash } from "node:crypto";

/** Strong, content-based validator for an editor file (not its mtime). */
export function getPostVersion(content: string): string {
  return `"sha256-${createHash("sha256").update(content, "utf8").digest("hex")}"`;
}

export class PostPreconditionError extends Error {
  constructor(
    message: string,
    public readonly status: 400 | 412 | 428,
    public readonly code: string,
  ) {
    super(message);
    this.name = "PostPreconditionError";
  }
}

/** Call inside the mutation lock, against the bytes about to be changed. */
export function assertPostPrecondition(
  currentContent: string | null,
  headers: Headers,
  creating: boolean,
): void {
  if (creating) {
    if (!headers.has("If-None-Match")) {
      throw new PostPreconditionError("Creating a post requires If-None-Match: *.", 428, "VERSION_REQUIRED");
    }
    if (headers.get("If-None-Match") !== "*" || headers.has("If-Match")) {
      throw new PostPreconditionError("New posts require only If-None-Match: *.", 400, "INVALID_VERSION");
    }
    if (currentContent !== null) {
      throw new PostPreconditionError("A file already exists at this path. Your input has not been saved over it.", 412, "POST_CHANGED");
    }
    return;
  }

  const expected = headers.get("If-Match");
  if (!expected) {
    throw new PostPreconditionError("Reload or compare the file before changing it. A saved version is required.", 428, "VERSION_REQUIRED");
  }
  // Wildcards and weak validators cannot protect against stale edits. This API
  // deliberately accepts one exact strong validator, not an ETag list.
  if (!/^"sha256-[a-f0-9]{64}"$/.test(expected) || headers.has("If-None-Match")) {
    throw new PostPreconditionError("If-Match must contain the exact file version returned by the editor.", 400, "INVALID_VERSION");
  }
  if (currentContent === null || expected !== getPostVersion(currentContent)) {
    throw new PostPreconditionError(
      currentContent === null
        ? "This file was deleted or moved after you loaded it. Your input is still in the editor."
        : "This file changed on disk after you loaded it. Your input has not overwritten the newer file.",
      412,
      "POST_CHANGED",
    );
  }
}
