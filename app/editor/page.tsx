"use client";

import NextImage from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ClipboardEvent, DragEvent, ReactNode } from "react";
import {
  componentsPalette,
  getComponentCategories,
  getComponentDefaultValues,
  renderComponentInsert,
  type ComponentSnippet,
  type ComponentSnippetField,
  type ComponentSnippetFormValues,
  type ComponentSnippetInsert,
} from "./snippets";
import {
  parsePendingEditorSnippet,
  PENDING_EDITOR_SNIPPET_KEY,
} from "./pending-snippet";
import {
  parseExportedMetadata,
  stripExportedMetadata,
} from "@/utils/shared/post-metadata";

type EditorFileOption = {
  path: string;
  label: string;
  status: EditorStatus;
  updatedAt: number;
};

type EditorStatus = "draft" | "published" | "archived";

type EditorAsset = {
  name: string;
  path: string;
  size: number;
  updatedAt: number;
  width?: number | null;
  height?: number | null;
};

type FeedbackTone = "success" | "error" | "info";

type EditorFeedback = {
  message: string;
  tone: FeedbackTone;
};

type EditorConfirmation = {
  title: string;
  description: string;
  confirmLabel: string;
  tone?: "default" | "danger";
};

type EditorDocumentState = {
  title: string;
  description: string;
  summary: string;
  series: string;
  publishedAt: string;
  updatedAt: string;
  id: string;
  status: EditorStatus;
  featured: boolean;
  tagsInput: string;
  cover: string;
  body: string;
};

type EditorWorkspaceSnapshot = EditorDocumentState & {
  activePath: string | null;
  targetPath: string;
};

type EditorLocalAutosave = EditorWorkspaceSnapshot & {
  version: 1;
  savedAt: number;
};

const LOCAL_AUTOSAVE_KEY = "mdx-editor.local-autosave.v1";
const LOCAL_AUTOSAVE_VERSION = 1;

function today() {
  return new Date().toISOString().slice(0, 10);
}

function buildTargetPath(publishedAt: string, id: string) {
  const year = publishedAt ? publishedAt.slice(0, 4) : "2025";
  return `app/(post)/${year}/${id}/page.mdx`;
}

function validateEditorTarget(publishedAt: string, id: string) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id) || id.length > 100) {
    return "Post ID must use 1-100 lowercase letters, numbers, and single hyphens.";
  }

  const parsedDate = new Date(`${publishedAt}T00:00:00.000Z`);
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(publishedAt) ||
    Number.isNaN(parsedDate.getTime()) ||
    parsedDate.toISOString().slice(0, 10) !== publishedAt
  ) {
    return "Published date must be a valid date in YYYY-MM-DD format.";
  }

  return null;
}

function normalizeAssetId(value: string) {
  const cleaned = value
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return cleaned || "misc";
}

function buildWorkspaceSnapshot(
  state: EditorDocumentState & { activePath: string | null },
): EditorWorkspaceSnapshot {
  return {
    ...state,
    targetPath: buildTargetPath(state.publishedAt, state.id),
  };
}

function serializeWorkspaceSnapshot(snapshot: EditorWorkspaceSnapshot) {
  return JSON.stringify(snapshot);
}

function parseMetadataObject(content: string) {
  return parseExportedMetadata<
    Partial<{
      title: string;
      description: string;
      summary: string;
      series: string;
      publishedAt: string;
      updatedAt: string;
      id: string;
      status: EditorStatus;
      draft: boolean;
      archived: boolean;
      featured: boolean;
      tags: string[] | string;
      cover: string;
    }>
  >(content);
}

function normalizeStatus(
  value: unknown,
  legacyDraft?: unknown,
  legacyArchived?: unknown,
): EditorStatus {
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (normalized === "draft" || normalized === "published" || normalized === "archived") {
      return normalized;
    }
  }

  if (normalizeBoolean(legacyArchived)) {
    return "archived";
  }

  if (normalizeBoolean(value) || normalizeBoolean(legacyDraft)) {
    return "draft";
  }

  return "published";
}

function normalizeBoolean(value: unknown): boolean {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    return normalized === "true" || normalized === "1" || normalized === "yes";
  }

  return false;
}

function parseEditorDocument(content: string, filePath: string): EditorDocumentState {
  const metadata = parseMetadataObject(content);
  const metadataTags = metadata?.tags;
  const body = stripExportedMetadata(content).trimStart();
  const slugFallback = filePath.split("/").at(-2) ?? "my-post";

  return {
    title: metadata?.title || "Untitled Post",
    description: metadata?.description || "",
    summary: metadata?.summary || "",
    series: metadata?.series || "",
    publishedAt: metadata?.publishedAt || today(),
    updatedAt: metadata?.updatedAt || "",
    id: metadata?.id || slugFallback,
    status: normalizeStatus(metadata?.status, metadata?.draft, metadata?.archived),
    featured: normalizeBoolean(metadata?.featured),
    tagsInput: Array.isArray(metadataTags)
      ? metadataTags.join(", ")
      : typeof metadataTags === "string"
        ? metadataTags
        : "",
    cover: typeof metadata?.cover === "string" ? metadata.cover : "",
    body,
  };
}

function parseLocalAutosave(rawValue: string | null): EditorLocalAutosave | null {
  if (!rawValue) {
    return null;
  }

  try {
    const parsed = JSON.parse(rawValue) as Partial<EditorLocalAutosave> & {
      isDraft?: boolean;
      isArchived?: boolean;
    };
    if (parsed?.version !== LOCAL_AUTOSAVE_VERSION) {
      return null;
    }

    if (
      typeof parsed.title !== "string" ||
      typeof parsed.description !== "string" ||
      typeof parsed.publishedAt !== "string" ||
      typeof parsed.id !== "string" ||
      typeof parsed.tagsInput !== "string" ||
      typeof parsed.cover !== "string" ||
      typeof parsed.body !== "string" ||
      typeof parsed.targetPath !== "string" ||
      typeof parsed.savedAt !== "number"
    ) {
      return null;
    }

    return {
      version: LOCAL_AUTOSAVE_VERSION,
      activePath: typeof parsed.activePath === "string" ? parsed.activePath : null,
      targetPath: parsed.targetPath,
      title: parsed.title,
      description: parsed.description,
      summary: typeof parsed.summary === "string" ? parsed.summary : "",
      series: typeof parsed.series === "string" ? parsed.series : "",
      publishedAt: parsed.publishedAt,
      updatedAt: typeof parsed.updatedAt === "string" ? parsed.updatedAt : "",
      id: parsed.id,
      status: normalizeStatus(parsed.status, parsed.isDraft, parsed.isArchived),
      featured: Boolean(parsed.featured),
      tagsInput: parsed.tagsInput,
      cover: parsed.cover,
      body: parsed.body,
      savedAt: parsed.savedAt,
    };
  } catch {
    return null;
  }
}

export default function EditorPage() {
  return <EditorWorkspace />;
}

function EditorWorkspace() {
  const [title, setTitle] = useState("Untitled Post");
  const [description, setDescription] = useState("Add a short summary for this post.");
  const [summary, setSummary] = useState("");
  const [series, setSeries] = useState("");
  const [publishedAt, setPublishedAt] = useState(today());
  const [updatedAt, setUpdatedAt] = useState("");
  const [id, setId] = useState("my-post");
  const [status, setStatus] = useState<EditorStatus>("draft");
  const [featured, setFeatured] = useState(false);
  const [tagsInput, setTagsInput] = useState("");
  const [cover, setCover] = useState("");
  const [body, setBody] = useState(`# ${title}\n\nStart writing here.\n`);
  const [fileOptions, setFileOptions] = useState<EditorFileOption[]>([]);
  const [activePath, setActivePath] = useState<string | null>(null);
  const [selectedPath, setSelectedPath] = useState("");
  const [showPicker, setShowPicker] = useState(false);
  const [feedback, setFeedback] = useState<EditorFeedback | null>(null);
  const [pickerFeedback, setPickerFeedback] = useState<EditorFeedback | null>(null);
  const [confirmation, setConfirmation] = useState<EditorConfirmation | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [assets, setAssets] = useState<EditorAsset[]>([]);
  const [isAssetsLoading, setIsAssetsLoading] = useState(false);
  const [deletingAssetPath, setDeletingAssetPath] = useState<string | null>(null);
  const [localAutosaveAt, setLocalAutosaveAt] = useState<number | null>(null);
  const editorRef = useRef<HTMLTextAreaElement | null>(null);
  const assetInputRef = useRef<HTMLInputElement | null>(null);
  const restoredDraftRef = useRef(false);
  const pendingAutosaveRef = useRef<EditorLocalAutosave | null>(null);
  const handledPendingSnippetRef = useRef<number | null>(null);
  const confirmationResolveRef = useRef<((value: boolean) => void) | null>(null);
  const [cursorPos, setCursorPos] = useState<number>(body.length);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);

  const workspaceSnapshot = useMemo(
    () =>
      buildWorkspaceSnapshot({
        activePath,
        title,
        description,
        summary,
        series,
        publishedAt,
        updatedAt,
        id,
        status,
        featured,
        tagsInput,
        cover,
        body,
      }),
    [
      activePath,
      title,
      description,
      summary,
      series,
      publishedAt,
      updatedAt,
      id,
      status,
      featured,
      tagsInput,
      cover,
      body,
    ],
  );
  const workspaceFingerprint = useMemo(
    () => serializeWorkspaceSnapshot(workspaceSnapshot),
    [workspaceSnapshot],
  );
  const [persistedFingerprint, setPersistedFingerprint] = useState(workspaceFingerprint);
  const currentStatus = status;
  const readingTimeEstimate = useMemo(() => estimateReadingTimeMinutes(body), [body]);
  const recentDrafts = useMemo(
    () =>
      [...fileOptions]
        .filter(file => file.status === "draft")
        .sort((a, b) => b.updatedAt - a.updatedAt)
        .slice(0, 5),
    [fileOptions],
  );
  const archivedPosts = useMemo(
    () =>
      [...fileOptions]
        .filter(file => file.status === "archived")
        .sort((a, b) => b.updatedAt - a.updatedAt)
        .slice(0, 5),
    [fileOptions],
  );
  const previewHref = useMemo(() => {
    const year = publishedAt ? publishedAt.slice(0, 4) : "2025";
    return `/${year}/${id}`;
  }, [publishedAt, id]);
  const assetFolderId = useMemo(() => normalizeAssetId(id), [id]);
  const isReadOnly = currentStatus === "archived";
  const canOpenPreview = currentStatus !== "archived" && activePath === workspaceSnapshot.targetPath;
  const isDirty = workspaceFingerprint !== persistedFingerprint;
  const targetPath = workspaceSnapshot.targetPath;

  const showFeedback = useCallback((message: string, tone: FeedbackTone = "info") => {
    setFeedback({ message, tone });
  }, []);

  const showPickerFeedback = useCallback((message: string, tone: FeedbackTone = "info") => {
    setPickerFeedback({ message, tone });
  }, []);

  const clearPickerFeedback = useCallback(() => {
    setPickerFeedback(null);
  }, []);

  const requestConfirmation = useCallback((nextConfirmation: EditorConfirmation) => {
    return new Promise<boolean>(resolve => {
      confirmationResolveRef.current = resolve;
      setConfirmation(nextConfirmation);
    });
  }, []);

  const resolveConfirmation = useCallback((confirmed: boolean) => {
    confirmationResolveRef.current?.(confirmed);
    confirmationResolveRef.current = null;
    setConfirmation(null);
  }, []);

  const mdxContent = useMemo(() => {
    return buildMdxContent({
      title,
      description,
      summary,
      series,
      publishedAt,
      updatedAt,
      id,
      status,
      featured,
      tagsInput,
      cover,
      body,
    });
  }, [title, description, summary, series, publishedAt, updatedAt, id, status, featured, tagsInput, cover, body]);

  const applyWorkspaceState = useCallback(
    (
      nextState: EditorDocumentState,
      options: {
        activePath?: string | null;
        markPersisted?: boolean;
      } = {},
    ) => {
      const nextActivePath = options.activePath ?? null;

      setTitle(nextState.title);
      setDescription(nextState.description);
      setSummary(nextState.summary);
      setSeries(nextState.series);
      setPublishedAt(nextState.publishedAt);
      setUpdatedAt(nextState.updatedAt);
      setId(nextState.id);
      setStatus(nextState.status);
      setFeatured(nextState.featured);
      setTagsInput(nextState.tagsInput);
      setCover(nextState.cover);
      setBody(nextState.body);
      setCursorPos(nextState.body.length);
      setActivePath(nextActivePath);

      if (nextActivePath) {
        setSelectedPath(nextActivePath);
      }

      if (options.markPersisted) {
        setPersistedFingerprint(
          serializeWorkspaceSnapshot(
            buildWorkspaceSnapshot({
              ...nextState,
              activePath: nextActivePath,
            }),
          ),
        );
      }
    },
    [],
  );

  const restoreLocalAutosave = useCallback(
    (options: { matchingPath?: string | null; allowUnmatched?: boolean } = {}) => {
      const autosave = pendingAutosaveRef.current;
      if (!autosave) {
        return false;
      }

      const matchesPath = options.matchingPath
        ? autosave.activePath === options.matchingPath || autosave.targetPath === options.matchingPath
        : Boolean(options.allowUnmatched);

      if (!matchesPath) {
        return false;
      }

      pendingAutosaveRef.current = null;
      applyWorkspaceState(
        {
          title: autosave.title,
          description: autosave.description,
          summary: autosave.summary,
          series: autosave.series,
          publishedAt: autosave.publishedAt,
          updatedAt: autosave.updatedAt,
          id: autosave.id,
          status: autosave.status,
          featured: autosave.featured,
          tagsInput: autosave.tagsInput,
          cover: autosave.cover,
          body: autosave.body,
        },
        {
          activePath: autosave.activePath,
        },
      );
      setLocalAutosaveAt(autosave.savedAt);
      showFeedback(`Restored local autosave from ${formatUpdatedAt(autosave.savedAt)}`, "success");
      return true;
    },
    [applyWorkspaceState, showFeedback],
  );

  const loadFromPath = useCallback(
    async (path: string, options: { successHint?: string } = {}) => {
      try {
        const res = await fetch(`/api/editor?path=${encodeURIComponent(path)}`, {
          cache: "no-store",
        });

        if (res.status === 404) {
          showPickerFeedback("The selected file was not found.", "error");
          return false;
        }

        if (!res.ok) {
          throw new Error(await readResponseError(res, "Failed to read the selected file."));
        }

        const data = await res.json();
        const content = typeof data.content === "string" ? data.content : "";
        if (!content) {
          showPickerFeedback("The selected file is empty.", "error");
          return false;
        }

        const nextState = parseEditorDocument(content, path);
        applyWorkspaceState(nextState, {
          activePath: path,
          markPersisted: true,
        });
        setShowPicker(false);
        clearPickerFeedback();

        const restoredAutosave = restoreLocalAutosave({ matchingPath: path });
        if (!restoredAutosave) {
          showFeedback(options.successHint ?? `Loaded: ${path}`, "success");
        }

        return true;
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to read the selected file.";
        showPickerFeedback(message, "error");
        showFeedback(message, "error");
        return false;
      }
    },
    [applyWorkspaceState, clearPickerFeedback, restoreLocalAutosave, showFeedback, showPickerFeedback],
  );

  const refreshFileList = useCallback(
    async (options: { autoRestoreLatestDraft?: boolean } = {}) => {
      try {
        const res = await fetch("/api/editor/list", {
          cache: "no-store",
        });

        if (!res.ok) {
          throw new Error(await readResponseError(res, "Failed to load the file list."));
        }

        const data = (await res.json()) as {
          files?: EditorFileOption[];
        };
        const files = data.files ?? [];

        setFileOptions(files);
        setSelectedPath(current =>
          current && files.some(file => file.path === current) ? current : files[0]?.path ?? "",
        );
        setPickerFeedback(
          files.length === 0 ? { message: "No files found.", tone: "info" } : null,
        );

        if (!options.autoRestoreLatestDraft) {
          return;
        }

        const latestDraft = files.reduce<EditorFileOption | null>((latest, file) => {
          if (file.status !== "draft") {
            return latest;
          }

          if (!latest || file.updatedAt > latest.updatedAt) {
            return file;
          }

          return latest;
        }, null);

        if (latestDraft) {
          await loadFromPath(latestDraft.path, {
            successHint: `Restored latest draft: ${latestDraft.label}`,
          });
          return;
        }

        restoreLocalAutosave({ allowUnmatched: true });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to load the file list.";
        showPickerFeedback(message, "error");
      }
    },
    [loadFromPath, restoreLocalAutosave, showPickerFeedback],
  );

  const refreshAssets = useCallback(
    async (options: { silent?: boolean } = {}) => {
      setIsAssetsLoading(true);

      try {
        const res = await fetch(`/api/editor/assets?id=${encodeURIComponent(assetFolderId)}`, {
          cache: "no-store",
        });

        if (!res.ok) {
          throw new Error(await readResponseError(res, "Failed to load assets."));
        }

        const data = (await res.json()) as {
          assets?: EditorAsset[];
        };
        setAssets(Array.isArray(data.assets) ? data.assets : []);
      } catch (error) {
        if (!options.silent) {
          showFeedback(
            error instanceof Error ? error.message : "Failed to load assets.",
            "error",
          );
        }
      } finally {
        setIsAssetsLoading(false);
      }
    },
    [assetFolderId, showFeedback],
  );

  async function saveFile(options: {
    statusOverride?: EditorStatus;
    showHint?: boolean;
    successHint?: string;
  } = {}) {
    try {
      const targetError = validateEditorTarget(publishedAt, id);
      if (targetError) {
        showFeedback(targetError, "error");
        return false;
      }

      const nextStatus = options.statusOverride ?? status;
      const content = buildMdxContent({
        title,
        description,
        summary,
        series,
        publishedAt,
        updatedAt,
        id,
        status: nextStatus,
        featured,
        tagsInput,
        cover,
        body,
      });

      const res = await fetch("/api/editor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          path: targetPath,
          previousPath: activePath,
          content,
        }),
      });

      if (!res.ok) {
        throw new Error(await readResponseError(res, "Save failed. Check the file path and permissions."));
      }

      applyWorkspaceState(
        {
          title,
          description,
          summary,
          series,
          publishedAt,
          updatedAt,
          id,
          status: nextStatus,
          featured,
          tagsInput,
          cover,
          body,
        },
        {
          activePath: targetPath,
          markPersisted: true,
        },
      );
      void refreshFileList();

      if (options.showHint !== false) {
        showFeedback(options.successHint ?? `Saved to ${targetPath}`, "success");
      }

      return true;
    } catch (error) {
      if (options.showHint !== false) {
        showFeedback(
          error instanceof Error ? error.message : "Save failed. Check the file path and permissions.",
          "error",
        );
      }
      return false;
    }
  }

  async function publishPost() {
    const confirmed = await requestConfirmation({
      title: "Publish Post",
      description: `Publish "${title}" and make it public at ${previewHref}?`,
      confirmLabel: "Publish",
    });

    if (!confirmed) {
      return;
    }

    const saved = await saveFile({
      statusOverride: "published",
      showHint: false,
    });

    if (!saved) {
      return;
    }

    try {
      const res = await fetch("/api/editor/publish", { method: "POST" });

      if (!res.ok) {
        throw new Error(await readResponseError(res, "Publish failed. Check the server logs."));
      }

      showFeedback(`Published and synchronized ${targetPath}`, "success");
    } catch (error) {
      showFeedback(
        error instanceof Error ? error.message : "Publish failed. Check the server logs.",
        "error",
      );
    }
  }

  async function moveToDraft() {
    await saveFile({
      statusOverride: "draft",
      successHint: `Moved back to draft: ${targetPath}`,
    });
  }

  async function archivePost() {
    const confirmed = await requestConfirmation({
      title: "Archive Post",
      description: `Archive "${title}"? Archived posts are removed from public view and can be restored later.`,
      confirmLabel: "Archive",
    });

    if (!confirmed) {
      return;
    }

    await saveFile({
      statusOverride: "archived",
      successHint: `Archived: ${targetPath}`,
    });
  }

  async function deleteCurrentPost() {
    if (!activePath) {
      showFeedback("Save this document once before deleting it.", "info");
      return;
    }

    const confirmed = await requestConfirmation({
      title: currentStatus === "archived" ? "Delete Archived Post" : "Delete Draft",
      description:
        currentStatus === "archived"
          ? `Delete archived post "${title}" permanently? This cannot be undone.`
          : `Delete draft "${title}" permanently? This cannot be undone.`,
      confirmLabel: "Delete",
      tone: "danger",
    });

    if (!confirmed) {
      return;
    }

    try {
      const res = await fetch("/api/editor", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: activePath }),
      });

      if (res.status === 409) {
        showFeedback("Published posts must be archived before they can be deleted.", "error");
        return;
      }

      if (!res.ok) {
        throw new Error(await readResponseError(res, "Delete failed. Check the file path and permissions."));
      }

      if (typeof window !== "undefined") {
        window.localStorage.removeItem(LOCAL_AUTOSAVE_KEY);
      }
      pendingAutosaveRef.current = null;
      setLocalAutosaveAt(null);

      const emptyTitle = "Untitled Post";
      applyWorkspaceState(
        {
          title: emptyTitle,
          description: "Add a short summary for this post.",
          summary: "",
          series: "",
          publishedAt: today(),
          updatedAt: "",
          id: "my-post",
          status: "draft",
          featured: false,
          tagsInput: "",
          cover: "",
          body: `# ${emptyTitle}\n\nStart writing here.\n`,
        },
        {
          activePath: null,
          markPersisted: true,
        },
      );
      setSelectedPath("");
      showFeedback(`Deleted: ${activePath}`, "success");
      await refreshFileList({ autoRestoreLatestDraft: true });
    } catch (error) {
      showFeedback(
        error instanceof Error ? error.message : "Delete failed. Check the file path and permissions.",
        "error",
      );
    }
  }

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    pendingAutosaveRef.current = parseLocalAutosave(window.localStorage.getItem(LOCAL_AUTOSAVE_KEY));
    setLocalAutosaveAt(pendingAutosaveRef.current?.savedAt ?? null);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const timer = window.setTimeout(() => {
      const autosave: EditorLocalAutosave = {
        version: LOCAL_AUTOSAVE_VERSION,
        savedAt: Date.now(),
        ...workspaceSnapshot,
      };
      window.localStorage.setItem(LOCAL_AUTOSAVE_KEY, JSON.stringify(autosave));
      setLocalAutosaveAt(autosave.savedAt);
    }, 800);

    return () => window.clearTimeout(timer);
  }, [workspaceSnapshot]);

  useEffect(() => {
    if (typeof window === "undefined" || !isDirty) {
      return;
    }

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  useEffect(() => {
    if (!feedback) return;
    const timer = setTimeout(() => setFeedback(null), 2200);
    return () => clearTimeout(timer);
  }, [feedback]);

  useEffect(() => {
    if (restoredDraftRef.current) {
      return;
    }

    // Restore the newest saved draft once so unfinished work reopens automatically.
    restoredDraftRef.current = true;
    void (async () => {
      await refreshFileList({ autoRestoreLatestDraft: true });
      setInitialLoadComplete(true);
    })();
  }, [refreshFileList]);

  useEffect(() => {
    if (!showPicker) return;
    void refreshFileList();
  }, [showPicker, refreshFileList]);

  useEffect(() => {
    void refreshAssets({ silent: true });
  }, [refreshAssets]);

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

      requestAnimationFrame(() => {
        const textarea = editorRef.current;
        if (textarea) {
          textarea.selectionStart = selectionStart;
          textarea.selectionEnd = selectionEnd;
          textarea.focus();
        }
      });
    },
    [body, cursorPos, isReadOnly],
  );

  const consumePendingEditorSnippet = useCallback(
    (rawValue: string | null, options: { removeAfterRead?: boolean } = {}) => {
      const pendingSnippet = parsePendingEditorSnippet(rawValue);
      if (!pendingSnippet) {
        return false;
      }

      if (handledPendingSnippetRef.current === pendingSnippet.createdAt) {
        return false;
      }

      if (isReadOnly) {
        handledPendingSnippetRef.current = pendingSnippet.createdAt;
        if (options.removeAfterRead !== false && typeof window !== "undefined") {
          window.localStorage.removeItem(PENDING_EDITOR_SNIPPET_KEY);
        }
        showFeedback(
          "The current post is read-only, so the queued component snippet was not inserted.",
          "error",
        );
        return false;
      }

      handledPendingSnippetRef.current = pendingSnippet.createdAt;
      insertSnippet(pendingSnippet.snippet);

      if (options.removeAfterRead !== false && typeof window !== "undefined") {
        window.localStorage.removeItem(PENDING_EDITOR_SNIPPET_KEY);
      }

      showFeedback("Inserted component snippet from the guide.", "success");
      return true;
    },
    [insertSnippet, isReadOnly, showFeedback],
  );

  useEffect(() => {
    if (typeof window === "undefined" || !initialLoadComplete) {
      return;
    }

    consumePendingEditorSnippet(window.localStorage.getItem(PENDING_EDITOR_SNIPPET_KEY));
  }, [consumePendingEditorSnippet, initialLoadComplete]);

  useEffect(() => {
    if (typeof window === "undefined" || !initialLoadComplete) {
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
  }, [consumePendingEditorSnippet, initialLoadComplete]);

  async function handleImageFile(file: File) {
    if (isReadOnly) {
      showFeedback("Archived posts are read-only. Restore to draft before editing.", "error");
      return;
    }

    if (!file || !file.type.startsWith("image/")) {
      showFeedback("Only image files are supported.", "error");
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("id", id);
      const res = await fetch("/api/editor/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || !data?.path) {
        throw new Error(resolveApiError(data, "Upload failed. Please try again."));
      }

      const snippet = buildImageSnippet({
        src: data.path as string,
        width: data.width as number | null | undefined,
        height: data.height as number | null | undefined,
        alt: stripExtension(file.name),
      });
      insertSnippet(snippet);
      await refreshAssets({ silent: true });
      showFeedback(`Inserted image: ${data.path}`, "success");
    } catch (error) {
      showFeedback(
        error instanceof Error ? error.message : "Upload failed. Please try again.",
        "error",
      );
    } finally {
      setIsUploading(false);
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
      void handleImageFile(files[0]);
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
      void handleImageFile(imageFile);
    }
  }

  async function copyAssetPath(assetPath: string) {
    try {
      await navigator.clipboard.writeText(assetPath);
      showFeedback(`Copied asset path: ${assetPath}`, "info");
    } catch {
      showFeedback("Failed to copy asset path.", "error");
    }
  }

  function insertAssetSnippet(asset: EditorAsset) {
    if (isReadOnly) {
      showFeedback("Archived posts are read-only. Restore to draft before editing.", "error");
      return;
    }

    insertSnippet(
      buildImageSnippet({
        src: asset.path,
        width: asset.width,
        height: asset.height,
        alt: stripExtension(asset.name),
      }),
    );
    showFeedback(`Inserted asset: ${asset.path}`, "success");
  }

  function applyAssetAsCover(asset: EditorAsset) {
    if (isReadOnly) {
      showFeedback("Archived posts are read-only. Restore to draft before editing.", "error");
      return;
    }

    setCover(asset.path);
    showFeedback(`Set cover image: ${asset.path}`, "success");
  }

  async function deleteAsset(asset: EditorAsset) {
    if (isReadOnly) {
      showFeedback("Archived posts are read-only. Restore to draft before editing.", "error");
      return;
    }

    const references = removeAssetReferencesFromBody(body, asset.path);
    const coverWillBeCleared = cover === asset.path;
    const confirmed = await requestConfirmation({
      title: "Delete Asset",
      description:
        references.removed > 0 || coverWillBeCleared
          ? `Delete asset "${asset.name}"? The current editor will also remove matching body or cover references. Save the post afterward to persist those content changes.`
          : `Delete asset "${asset.name}"? This only removes the file from /public/images.`,
      confirmLabel: "Delete",
      tone: "danger",
    });

    if (!confirmed) {
      return;
    }

    try {
      setDeletingAssetPath(asset.path);
      const res = await fetch("/api/editor/assets", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ path: asset.path }),
      });

      if (!res.ok) {
        throw new Error(await readResponseError(res, "Failed to delete asset."));
      }

      setAssets(current => current.filter(currentAsset => currentAsset.path !== asset.path));
      if (references.removed > 0) {
        setBody(references.body);
        setCursorPos(current => Math.min(current, references.body.length));
      }
      if (coverWillBeCleared) {
        setCover("");
      }
      showFeedback(
        references.removed > 0 || coverWillBeCleared
          ? `Deleted asset and removed current editor references. Save the post to persist the content change.`
          : `Deleted asset: ${asset.path}`,
        "success",
      );
    } catch (error) {
      showFeedback(
        error instanceof Error ? error.message : "Failed to delete asset.",
        "error",
      );
    } finally {
      setDeletingAssetPath(null);
    }
  }

  return (
    <main
      className="flex w-screen max-w-none flex-col gap-6 px-4 py-8 lg:px-6"
      style={{ marginLeft: "calc(50% - 50vw)" }}
    >
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">MDX Editor</h1>
          <p className="text-sm text-slate-500">
            Fill in metadata and body content, then save directly to disk.
            Publishing first switches the post out of draft mode and then
            synchronizes the post index.
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
          {currentStatus !== "archived" ? (
            <button
              onClick={() => void saveFile()}
              className="rounded-full bg-gray-900 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-gray-700"
            >
              {currentStatus === "draft" ? "Save Draft" : "Save Published Changes"}
            </button>
          ) : null}
          {currentStatus === "draft" ? (
            <button
              onClick={publishPost}
              className="rounded-full bg-gray-900 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-gray-700"
            >
              Publish Post
            </button>
          ) : null}
          {currentStatus === "published" ? (
            <button
              onClick={moveToDraft}
              className="rounded-full border border-sky-300 bg-sky-50 px-4 py-2 text-sm font-semibold text-sky-900 hover:bg-sky-100"
            >
              Move To Draft
            </button>
          ) : null}
          {currentStatus === "published" ? (
            <button
              onClick={archivePost}
              className="rounded-full border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-900 hover:bg-amber-100"
            >
              Archive Post
            </button>
          ) : null}
          {currentStatus === "archived" ? (
            <button
              onClick={moveToDraft}
              className="rounded-full border border-sky-300 bg-sky-50 px-4 py-2 text-sm font-semibold text-sky-900 hover:bg-sky-100"
            >
              Restore To Draft
            </button>
          ) : null}
          {(currentStatus === "draft" || currentStatus === "archived") && activePath ? (
            <button
              onClick={deleteCurrentPost}
              className="rounded-full border border-rose-300 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-900 hover:bg-rose-100"
            >
              {currentStatus === "archived" ? "Delete Permanently" : "Delete Draft"}
            </button>
          ) : null}
          <button
            onClick={() => setShowPicker(true)}
            className="rounded-full bg-gray-900 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-gray-700"
          >
            Load
          </button>
        </div>
      </header>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        {isReadOnly ? (
          <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
            Archived posts are read-only. Restore this post to draft before editing content or metadata.
          </div>
        ) : null}
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
          <Field label="Title">
            <input
              value={title}
              onChange={event => setTitle(event.target.value)}
              className="rounded-md border border-slate-200 px-3 py-2 text-sm"
              disabled={isReadOnly}
            />
          </Field>
          <Field label="ID">
            <input
              value={id}
              onChange={event => setId(event.target.value)}
              className="rounded-md border border-slate-200 px-3 py-2 text-sm"
              disabled={isReadOnly}
            />
          </Field>
          <Field label="Status">
            <div className="flex min-h-10 items-center rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
              <span
                className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-wide ${
                  currentStatus === "draft"
                    ? "bg-amber-100 text-amber-900"
                    : currentStatus === "archived"
                      ? "bg-slate-200 text-slate-800"
                      : "bg-emerald-100 text-emerald-900"
                }`}
              >
                {currentStatus}
              </span>
              <span className="ml-3 text-xs text-slate-500">
                {currentStatus === "draft"
                  ? "Use Publish to make this article public."
                  : currentStatus === "archived"
                    ? "Archived posts are read-only until you restore them."
                    : "Use Move To Draft for private editing or Archive to freeze and hide this article."}
              </span>
            </div>
          </Field>
          <Field label="Published At (YYYY-MM-DD)">
            <input
              type="date"
              value={publishedAt}
              onChange={event => setPublishedAt(event.target.value)}
              className="rounded-md border border-slate-200 px-3 py-2 text-sm"
              disabled={isReadOnly}
            />
          </Field>
          <Field label="Updated At (YYYY-MM-DD)">
            <input
              type="date"
              value={updatedAt}
              onChange={event => setUpdatedAt(event.target.value)}
              className="rounded-md border border-slate-200 px-3 py-2 text-sm"
              disabled={isReadOnly}
            />
          </Field>
          <Field label="Series">
            <input
              value={series}
              onChange={event => setSeries(event.target.value)}
              className="rounded-md border border-slate-200 px-3 py-2 text-sm"
              placeholder="Editor Workflow"
              disabled={isReadOnly}
            />
          </Field>
          <Field label="Featured">
            <label className="flex min-h-10 items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={featured}
                onChange={event => setFeatured(event.target.checked)}
                disabled={isReadOnly}
              />
              Feature this post on landing surfaces.
            </label>
          </Field>
          <Field label="Tags (comma separated)">
            <input
              value={tagsInput}
              onChange={event => setTagsInput(event.target.value)}
              className="rounded-md border border-slate-200 px-3 py-2 text-sm"
              placeholder="nextjs, mdx, writing"
              disabled={isReadOnly}
            />
          </Field>
          <Field label="Cover">
            <input
              value={cover}
              onChange={event => setCover(event.target.value)}
              className="rounded-md border border-slate-200 px-3 py-2 text-sm"
              placeholder="/images/post/cover.jpg"
              disabled={isReadOnly}
            />
          </Field>
          <Field label="Description" spanFull>
            <input
              value={description}
              onChange={event => setDescription(event.target.value)}
              className="rounded-md border border-slate-200 px-3 py-2 text-sm"
              disabled={isReadOnly}
            />
          </Field>
          <Field label="Summary" spanFull>
            <textarea
              value={summary}
              onChange={event => setSummary(event.target.value)}
              className="min-h-24 rounded-md border border-slate-200 px-3 py-2 text-sm"
              placeholder="Short card summary for featured sections, search, and related posts."
              disabled={isReadOnly}
            />
          </Field>
        </div>

        <div className="mt-4 flex flex-wrap gap-3 text-xs text-slate-500">
          <span>Target path: {targetPath}</span>
          <span>Estimated reading time: {readingTimeEstimate} min</span>
          <span>Current status: {currentStatus}</span>
          <span>{featured ? "Featured post" : "Standard post"}</span>
          <span>{isDirty ? "Unsaved changes" : "All changes saved to disk"}</span>
          {localAutosaveAt ? <span>Local autosave: {formatUpdatedAt(localAutosaveAt)}</span> : null}
          {currentStatus !== "archived" && !canOpenPreview ? (
            <span>Save the current path once to enable preview.</span>
          ) : null}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-600">Body (MDX)</label>
            {isUploading ? (
              <span className="text-xs text-slate-400">Uploading image...</span>
            ) : null}
          </div>
          <textarea
            id="editor-body"
            ref={editorRef}
            value={body}
            onChange={event => {
              setBody(event.target.value);
              setCursorPos(event.target.selectionStart ?? event.target.value.length);
            }}
            onSelect={event => {
              const target = event.target as HTMLTextAreaElement;
              setCursorPos(target.selectionStart ?? 0);
            }}
            onDrop={handleDrop}
            onDragOver={event => event.preventDefault()}
            onPaste={handlePaste}
            className="min-h-[800px] w-full rounded-md border border-slate-200 px-3 py-2 font-mono text-sm"
            spellCheck={false}
            disabled={isReadOnly}
          />
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold text-slate-700">Image Assets</h2>
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Assets are grouped by post ID in <code>/public/images/{assetFolderId}</code>.
                  Existing files stay in their current folder if you later rename the post ID.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <input
                  ref={assetInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  className="hidden"
                  onChange={event => {
                    const file = event.target.files?.[0];
                    if (file) {
                      void handleImageFile(file);
                    }
                    event.target.value = "";
                  }}
                  disabled={isReadOnly || isUploading}
                />
                <button
                  type="button"
                  onClick={() => assetInputRef.current?.click()}
                  disabled={isReadOnly || isUploading}
                  className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-50 disabled:text-slate-400"
                >
                  {isUploading ? "Uploading..." : "Upload Image"}
                </button>
                <button
                  type="button"
                  onClick={() => void refreshAssets()}
                  disabled={isAssetsLoading}
                  className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-50 disabled:text-slate-400"
                >
                  {isAssetsLoading ? "Refreshing..." : "Refresh"}
                </button>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-500">
              <span>Folder: /images/{assetFolderId}</span>
              <span>{assets.length} asset{assets.length === 1 ? "" : "s"}</span>
              <span>{cover ? `Current cover: ${cover}` : "No cover selected"}</span>
            </div>

            {assets.length === 0 ? (
              <div className="mt-4 rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-sm text-slate-500">
                No uploaded images yet. Upload here, drag an image into the editor, or paste one
                from the clipboard.
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                {assets.map(asset => (
                  <div
                    key={asset.path}
                    className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3"
                  >
                    <div className="flex gap-3">
                      <div className="relative h-24 w-32 overflow-hidden rounded-lg border border-slate-200 bg-white">
                        <NextImage
                          src={asset.path}
                          alt={asset.name}
                          fill
                          sizes="128px"
                          className="object-cover"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate text-sm font-semibold text-slate-700">
                            {asset.name}
                          </p>
                          {cover === asset.path ? (
                            <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-sky-900">
                              Cover
                            </span>
                          ) : null}
                        </div>
                        <p className="mt-1 truncate font-mono text-[11px] text-slate-500">
                          {asset.path}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-3 text-[11px] text-slate-500">
                          <span>{formatFileSize(asset.size)}</span>
                          <span>Updated {formatUpdatedAt(asset.updatedAt)}</span>
                          {asset.width && asset.height ? (
                            <span>
                              {asset.width} x {asset.height}
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => insertAssetSnippet(asset)}
                        disabled={isReadOnly}
                        className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-white disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-white/60 disabled:text-slate-400"
                      >
                        Insert
                      </button>
                      <button
                        type="button"
                        onClick={() => applyAssetAsCover(asset)}
                        disabled={isReadOnly}
                        className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-white disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-white/60 disabled:text-slate-400"
                      >
                        Set Cover
                      </button>
                      <button
                        type="button"
                        onClick={() => void copyAssetPath(asset.path)}
                        className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-white"
                      >
                        Copy Path
                      </button>
                      <a
                        href={asset.path}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-white"
                      >
                        Open
                      </a>
                      <button
                        type="button"
                        onClick={() => void deleteAsset(asset)}
                        disabled={isReadOnly || deletingAssetPath === asset.path}
                        className="rounded-full border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-50 disabled:cursor-not-allowed disabled:border-rose-100 disabled:bg-white/60 disabled:text-rose-300"
                      >
                        {deletingAssetPath === asset.path ? "Deleting..." : "Delete"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-700">Component Library</h2>
            <ComponentPalette onInsert={insertSnippet} disabled={isReadOnly} />
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

      {showPicker ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-[480px] max-w-[90vw] rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-800">Select File</h3>
              </div>
              <button
                onClick={() => setShowPicker(false)}
                className="rounded-full border border-slate-200 px-2 py-1 text-xs text-slate-600 hover:bg-slate-100"
              >
                Close
              </button>
            </div>
            <div className="mt-3 max-h-72 overflow-y-auto rounded-md border border-slate-200 bg-slate-50 p-2 text-xs text-slate-700">
              <div className="mb-3 rounded-md border border-slate-200 bg-white p-2">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                    Recent Drafts
                  </div>
                  <div className="text-[11px] text-slate-400">
                    {recentDrafts.length === 0 ? "No saved drafts" : `${recentDrafts.length} shown`}
                  </div>
                </div>
                {recentDrafts.length === 0 ? (
                  <div className="rounded-md border border-dashed border-slate-200 bg-slate-50 px-3 py-2 text-[11px] text-slate-400">
                    Save a draft once and it will appear here for one-click restore.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {recentDrafts.map(file => (
                      <button
                        key={`recent-${file.path}`}
                        type="button"
                        onClick={() => void loadFromPath(file.path)}
                        className={`flex w-full items-start justify-between gap-3 rounded-md border px-3 py-2 text-left transition ${
                          file.path === selectedPath
                            ? "border-indigo-400 bg-indigo-50"
                            : "border-slate-200 bg-slate-50 hover:border-indigo-300 hover:bg-indigo-50"
                        }`}
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="truncate text-[12px] font-semibold text-slate-700">
                              {file.label}
                            </span>
                            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-900">
                              Draft
                            </span>
                          </div>
                          <div className="mt-1 truncate text-[11px] text-slate-400">
                            Updated {formatUpdatedAt(file.updatedAt)}
                          </div>
                        </div>
                        <span className="shrink-0 text-[11px] text-slate-400">Open</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {fileOptions.length === 0 ? (
                <div className="text-slate-400">No files found. Confirm that app/(post)/YEAR/slug/page.mdx exists.</div>
              ) : (
                <FolderTree
                  tree={buildTree(fileOptions)}
                  selectedPath={selectedPath}
                  onSelect={loadFromPath}
                />
              )}
              <div className="mt-3 rounded-md border border-slate-200 bg-white p-2">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                    Archived Posts
                  </div>
                  <div className="text-[11px] text-slate-400">
                    {archivedPosts.length === 0 ? "No archived posts" : `${archivedPosts.length} shown`}
                  </div>
                </div>
                {archivedPosts.length === 0 ? (
                  <div className="rounded-md border border-dashed border-slate-200 bg-slate-50 px-3 py-2 text-[11px] text-slate-400">
                    Archived posts stay here for read-only review or restore later.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {archivedPosts.map(file => (
                      <button
                        key={`archived-${file.path}`}
                        type="button"
                        onClick={() => void loadFromPath(file.path)}
                        className={`flex w-full items-start justify-between gap-3 rounded-md border px-3 py-2 text-left transition ${
                          file.path === selectedPath
                            ? "border-indigo-400 bg-indigo-50"
                            : "border-slate-200 bg-slate-50 hover:border-indigo-300 hover:bg-indigo-50"
                        }`}
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="truncate text-[12px] font-semibold text-slate-700">
                              {file.label}
                            </span>
                            <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-800">
                              Archived
                            </span>
                          </div>
                          <div className="mt-1 truncate text-[11px] text-slate-400">
                            Updated {formatUpdatedAt(file.updatedAt)}
                          </div>
                        </div>
                        <span className="shrink-0 text-[11px] text-slate-400">Open</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            {pickerFeedback ? (
              <div
                className={`mt-2 text-[11px] ${
                  pickerFeedback.tone === "error" ? "text-rose-500" : "text-slate-500"
                }`}
              >
                {pickerFeedback.message}
              </div>
            ) : null}
            <div className="mt-2 text-[11px] text-slate-500">
              Draft and archived posts are marked with badges. Only drafts are eligible for automatic restore.
            </div>
          </div>
        </div>
      ) : null}

      {confirmation ? (
        <ConfirmationDialog
          confirmation={confirmation}
          onCancel={() => resolveConfirmation(false)}
          onConfirm={() => resolveConfirmation(true)}
        />
      ) : null}

      <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-600 shadow-sm">
        <div className="font-semibold text-slate-700">Current Metadata Preview</div>
        <pre className="mt-2 overflow-x-auto whitespace-pre-wrap">{mdxContent.split("\n\n")[0]}</pre>
      </section>
    </main>
  );
}

function buildMdxContent({
  title,
  description,
  summary,
  series,
  publishedAt,
  updatedAt,
  id,
  status,
  featured,
  tagsInput,
  cover,
  body,
}: {
  title: string;
  description: string;
  summary: string;
  series: string;
  publishedAt: string;
  updatedAt: string;
  id: string;
  status: EditorStatus;
  featured: boolean;
  tagsInput: string;
  cover: string;
  body: string;
}) {
  const metadata = buildMetadataObject({
    title,
    description,
    summary,
    series,
    publishedAt,
    updatedAt,
    id,
    status,
    featured,
    tagsInput,
    cover,
  });

  return `export const metadata = ${JSON.stringify(metadata, null, 2)};\n\n${body.trim()}\n`;
}

function buildMetadataObject({
  title,
  description,
  summary,
  series,
  publishedAt,
  updatedAt,
  id,
  status,
  featured,
  tagsInput,
  cover,
}: {
  title: string;
  description: string;
  summary: string;
  series: string;
  publishedAt: string;
  updatedAt: string;
  id: string;
  status: EditorStatus;
  featured: boolean;
  tagsInput: string;
  cover: string;
}) {
  const tags = tagsInput
    .split(",")
    .map(item => item.trim())
    .filter(Boolean);

  const metadata: Record<string, unknown> = {
    title,
    description,
    publishedAt,
    id,
    status,
    tags,
  };

  if (summary.trim()) {
    metadata.summary = summary.trim();
  }

  if (series.trim()) {
    metadata.series = series.trim();
  }

  if (updatedAt.trim()) {
    metadata.updatedAt = updatedAt.trim();
  }

  if (featured) {
    metadata.featured = true;
  }

  if (cover.trim()) {
    metadata.cover = cover.trim();
  }

  return metadata;
}

function buildImageSnippet({
  src,
  width,
  height,
  alt,
}: {
  src: string;
  width?: number | null;
  height?: number | null;
  alt?: string;
}) {
  const lines = ["<Image", `  src="${src}"`];

  if (width && width > 0) {
    lines.push(`  width={${width}}`);
  }

  if (height && height > 0) {
    lines.push(`  height={${height}}`);
  }

  lines.push(`  alt="${escapeValue(alt ?? "")}"`);
  lines.push("/>");

  return lines.join("\n");
}

function escapeValue(value: string) {
  return value.replace(/"/g, '\\"');
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function removeAssetReferencesFromBody(source: string, assetPath: string) {
  const escapedPath = escapeRegExp(assetPath);
  const patterns = [
    new RegExp(
      String.raw`(?:\n{0,2})<Image\b[\s\S]*?src=(["'])${escapedPath}\1[\s\S]*?\/>(?:\n{0,2})`,
      "g",
    ),
    new RegExp(
      String.raw`!\[[^\]]*]\(${escapedPath.replace(/\//g, "\\/")}(?:\s+["'][^"']*["'])?\)`,
      "g",
    ),
    new RegExp(
      String.raw`<img\b[^>]*src=(["'])${escapedPath}\1[^>]*\/?>`,
      "g",
    ),
  ];

  let nextBody = source;
  let removed = 0;

  for (const pattern of patterns) {
    nextBody = nextBody.replace(pattern, match => {
      removed += 1;
      return match.startsWith("\n") ? "\n" : "";
    });
  }

  if (removed > 0) {
    nextBody = nextBody.replace(/\n{3,}/g, "\n\n");
  }

  return {
    body: nextBody,
    removed,
  };
}

function stripExtension(name: string) {
  return name.replace(/\.[^.]+$/, "");
}

function formatFileSize(bytes: number) {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return "0 B";
  }

  const units = ["B", "KB", "MB", "GB"];
  let value = bytes;
  let unitIndex = 0;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }

  return `${value >= 10 || unitIndex === 0 ? value.toFixed(0) : value.toFixed(1)} ${units[unitIndex]}`;
}

function estimateReadingTimeMinutes(source: string) {
  const text = source
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`[^`]*`/g, " ")
    .replace(/!\[[^\]]*]\([^)]*\)/g, " ")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/<[^>]+>/g, " ")
    .replace(/[#>*_~[\](){}]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const latinWords = text.match(/[A-Za-z0-9]+(?:['-][A-Za-z0-9]+)*/g) ?? [];
  const cjkChars = text.match(/[\u3400-\u9fff]/g) ?? [];
  const totalUnits = latinWords.length + cjkChars.length;

  if (totalUnits === 0) {
    return 1;
  }

  return Math.max(1, Math.ceil(totalUnits / 220));
}

function formatUpdatedAt(value: number) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "unknown";
  }

  return new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function ConfirmationDialog({
  confirmation,
  onCancel,
  onConfirm,
}: {
  confirmation: EditorConfirmation;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/45 px-4">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
        <div className="space-y-2">
          <p className="font-mono text-xs uppercase tracking-[0.25em] text-slate-500">
            Confirm Action
          </p>
          <h3 className="text-xl font-semibold text-slate-900">{confirmation.title}</h3>
          <p className="text-sm leading-6 text-slate-600">{confirmation.description}</p>
        </div>

        <div className="mt-6 flex flex-wrap justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`rounded-full px-4 py-2 text-sm font-semibold text-white shadow ${
              confirmation.tone === "danger"
                ? "bg-rose-600 hover:bg-rose-500"
                : "bg-slate-900 hover:bg-slate-700"
            }`}
          >
            {confirmation.confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

async function readResponseError(response: Response, fallbackMessage: string) {
  try {
    const payload = await response.clone().json();
    return resolveApiError(payload, fallbackMessage);
  } catch {
    return fallbackMessage;
  }
}

function resolveApiError(payload: unknown, fallbackMessage: string) {
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

function Field({
  label,
  children,
  spanFull,
}: {
  label: string;
  children: ReactNode;
  spanFull?: boolean;
}) {
  return (
    <div className={`flex flex-col gap-1 ${spanFull ? "md:col-span-2 lg:col-span-4" : ""}`}>
      <label className="text-xs font-semibold text-slate-600">{label}</label>
      {children}
    </div>
  );
}

function ComponentPalette({
  onInsert,
  disabled,
}: {
  onInsert: (snippet: string | ComponentSnippetInsert) => void;
  disabled?: boolean;
}) {
  const categories = useMemo(() => ["All", ...getComponentCategories()], []);
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [selectedComponentId, setSelectedComponentId] = useState<string | null>(null);
  const [formValues, setFormValues] = useState<ComponentSnippetFormValues>({});

  const filteredEntries = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return componentsPalette.filter(entry => {
      if (activeCategory !== "All" && entry.category !== activeCategory) {
        return false;
      }

      if (!normalizedQuery) {
        return true;
      }

      const haystack = [entry.label, entry.hint, entry.category, ...(entry.searchTerms ?? [])]
        .join(" ")
        .toLowerCase();
      return haystack.includes(normalizedQuery);
    });
  }, [activeCategory, query]);
  const grouped = useMemo(() => groupComponentSnippets(filteredEntries), [filteredEntries]);
  const selectedEntry = useMemo(
    () => componentsPalette.find(entry => entry.id === selectedComponentId) ?? null,
    [selectedComponentId],
  );
  const configuredSnippet = useMemo(() => {
    if (!selectedEntry) {
      return null;
    }

    return renderComponentInsert(selectedEntry, formValues);
  }, [formValues, selectedEntry]);

  function handleConfigure(entry: ComponentSnippet) {
    setSelectedComponentId(entry.id);
    setFormValues(getComponentDefaultValues(entry));
  }

  function handleQuickInsert(entry: ComponentSnippet) {
    onInsert(renderComponentInsert(entry));
  }

  function updateFormValue(fieldId: string, value: string | boolean) {
    setFormValues(current => ({
      ...current,
      [fieldId]: value,
    }));
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="text-xs font-semibold text-slate-600">Insert component</div>
          <div className="text-[11px] text-slate-500">
            Search by name, filter by category, or configure supported props before inserting.
          </div>
        </div>
        <a
          href="/editor/components"
          target="_blank"
          rel="noreferrer"
          className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-500"
        >
          Open component guide
        </a>
      </div>

      <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50/80 p-3">
        <input
          type="search"
          value={query}
          onChange={event => setQuery(event.target.value)}
          placeholder="Search components, patterns, or props"
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm placeholder:text-slate-400"
        />
        <div className="flex flex-wrap gap-2">
          {categories.map(category => {
            const isActive = category === activeCategory;
            return (
              <button
                key={category}
                type="button"
                onClick={() => setActiveCategory(category)}
                className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] transition ${
                  isActive
                    ? "bg-slate-900 text-white shadow-sm"
                    : "border border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900"
                }`}
              >
                {category}
              </button>
            );
          })}
        </div>
        <div className="text-[11px] text-slate-500">
          {filteredEntries.length} component{filteredEntries.length === 1 ? "" : "s"} match the current filters.
        </div>
      </div>

      {selectedEntry?.fields?.length && configuredSnippet ? (
        <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="font-semibold text-slate-900">{selectedEntry.label}</div>
              <div className="mt-1 text-sm text-slate-600">{selectedEntry.hint}</div>
            </div>
            <button
              type="button"
              onClick={() => setSelectedComponentId(null)}
              className="rounded-full border border-slate-200 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-600 hover:bg-white"
            >
              Close
            </button>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            {selectedEntry.fields.map(field => (
              <ComponentConfiguratorField
                key={field.id}
                field={field}
                value={formValues[field.id]}
                disabled={disabled}
                onChange={value => updateFormValue(field.id, value)}
              />
            ))}
          </div>

          {selectedEntry.notes?.length ? (
            <ul className="space-y-2 text-xs text-slate-500">
              {selectedEntry.notes.map(note => (
                <li
                  key={note}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 leading-6"
                >
                  {note}
                </li>
              ))}
            </ul>
          ) : null}

          <div className="space-y-2">
            <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">
              Insert Preview
            </div>
            <pre className="overflow-x-auto rounded-2xl border border-slate-200 bg-slate-950 p-4 text-xs leading-6 text-slate-100 shadow-inner">
              <code>{configuredSnippet.content}</code>
            </pre>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => onInsert(configuredSnippet)}
              disabled={disabled}
              className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              Insert into body
            </button>
            <button
              type="button"
              onClick={() => setFormValues(getComponentDefaultValues(selectedEntry))}
              disabled={disabled}
              className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-white disabled:cursor-not-allowed disabled:text-slate-400"
            >
              Reset defaults
            </button>
          </div>
        </div>
      ) : null}

      <div className="space-y-4">
        {filteredEntries.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-500">
            No components match the current search. Try another keyword or switch categories.
          </div>
        ) : null}

        {Object.entries(grouped).map(([category, items]) => (
          <div key={category} className="space-y-2">
            <div className="font-mono text-[11px] uppercase tracking-[0.24em] text-slate-500">
              {category}
            </div>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((item: ComponentSnippet) => {
                const isSelected = item.id === selectedComponentId;
                const hasConfigurator = Boolean(item.fields?.length);

                return (
                <div
                  key={item.id}
                  className={`rounded-2xl border px-3 py-3 text-left text-sm shadow-sm transition ${
                    isSelected
                      ? "border-indigo-300 bg-indigo-50/80"
                      : "border-slate-200 bg-white hover:border-indigo-200 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-semibold text-slate-900">{item.label}</div>
                      <div className="mt-1 text-[11px] text-slate-500">{item.hint}</div>
                    </div>
                    {hasConfigurator ? (
                      <span className="rounded-full bg-white px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500 shadow-sm">
                        Form
                      </span>
                    ) : null}
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {hasConfigurator ? (
                      <>
                        <button
                          type="button"
                          onClick={() => handleConfigure(item)}
                          disabled={disabled}
                          className="rounded-full bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                        >
                          Configure
                        </button>
                        <button
                          type="button"
                          onClick={() => handleQuickInsert(item)}
                          disabled={disabled}
                          className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-400"
                        >
                          Quick insert
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onInsert(renderComponentInsert(item))}
                        disabled={disabled}
                        className="rounded-full bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                      >
                        Insert
                      </button>
                    )}
                  </div>
                </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ComponentConfiguratorField({
  field,
  value,
  disabled,
  onChange,
}: {
  field: ComponentSnippetField;
  value: string | boolean | undefined;
  disabled?: boolean;
  onChange: (value: string | boolean) => void;
}) {
  const baseInputClass =
    "w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm placeholder:text-slate-400";

  return (
    <div className="space-y-1">
      <label className="text-xs font-semibold text-slate-600">{field.label}</label>

      {field.type === "textarea" ? (
        <textarea
          value={typeof value === "string" ? value : ""}
          onChange={event => onChange(event.target.value)}
          rows={field.rows ?? 4}
          placeholder={field.placeholder}
          disabled={disabled}
          className={`${baseInputClass} resize-y`}
        />
      ) : field.type === "select" ? (
        <select
          value={typeof value === "string" ? value : ""}
          onChange={event => onChange(event.target.value)}
          disabled={disabled}
          className={baseInputClass}
        >
          {field.options?.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : field.type === "boolean" ? (
        <label className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm">
          <input
            type="checkbox"
            checked={Boolean(value)}
            onChange={event => onChange(event.target.checked)}
            disabled={disabled}
            className="h-4 w-4 rounded border-slate-300 text-slate-900"
          />
          <span>Enabled</span>
        </label>
      ) : (
        <input
          type="text"
          value={typeof value === "string" ? value : ""}
          onChange={event => onChange(event.target.value)}
          placeholder={field.placeholder}
          disabled={disabled}
          className={baseInputClass}
        />
      )}

      {field.help ? <p className="text-[11px] text-slate-500">{field.help}</p> : null}
    </div>
  );
}

function groupComponentSnippets(entries: ComponentSnippet[]) {
  return entries.reduce<Record<string, ComponentSnippet[]>>((groups, entry) => {
    if (!groups[entry.category]) {
      groups[entry.category] = [];
    }

    groups[entry.category].push(entry);
    return groups;
  }, {});
}

type TreeNode = {
  name: string;
  path?: string;
  status?: EditorStatus;
  children?: TreeNode[];
};

function getOrCreate(nodes: TreeNode[], name: string): TreeNode {
  let node = nodes.find(item => item.name === name);
  if (!node) {
    node = { name, children: [] };
    nodes.push(node);
  }
  return node;
}

function buildTree(files: EditorFileOption[]): TreeNode[] {
  const root: TreeNode[] = [];

  for (const file of files) {
    const parts = file.label.split("/");
    if (parts.length < 2) continue;

    const [year, slug] = parts;
    const yearNode = getOrCreate(root, year);
    const slugNode = getOrCreate(yearNode.children!, slug);
    slugNode.path = file.path;
    slugNode.status = file.status;
  }

  return root;
}

function FolderTree({
  tree,
  selectedPath,
  onSelect,
}: {
  tree: TreeNode[];
  selectedPath: string;
  onSelect: (path: string) => void;
}) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  function toggleYear(key: string) {
    setExpanded(prev => ({ ...prev, [key]: !prev[key] }));
  }

  return (
    <div className="space-y-1">
      {tree.map(yearNode => {
        const yearKey = yearNode.name;
        const isYearOpen = Boolean(expanded[yearKey]);

        return (
          <div key={yearKey} className="rounded-md border border-slate-200 bg-white p-2">
            <button
              type="button"
              onClick={() => toggleYear(yearKey)}
              className="flex w-full items-center justify-between text-left font-semibold text-slate-700"
            >
              <span>{yearNode.name}</span>
              <span className="text-[11px] text-slate-500">
                {isYearOpen ? "Collapse" : "Expand"}
              </span>
            </button>

            {isYearOpen ? (
              <div className="mt-1 space-y-1 pl-2">
                {yearNode.children?.map(slugNode => (
                  <div
                    key={`${yearKey}/${slugNode.name}`}
                    className="rounded-md border border-slate-100 bg-white/60 p-1"
                  >
                    <button
                      type="button"
                      onClick={() => slugNode.path && onSelect(slugNode.path)}
                      className={`flex w-full items-center justify-between gap-2 rounded border px-2 py-1 text-left text-[12px] transition ${
                        slugNode.path === selectedPath
                          ? "border-indigo-400 bg-indigo-50 text-indigo-700"
                          : "border-slate-200 bg-white text-slate-700 hover:border-indigo-300 hover:bg-indigo-50"
                      }`}
                    >
                      <span>{slugNode.name}</span>
                      {slugNode.status === "archived" ? (
                        <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-800">
                          Archived
                        </span>
                      ) : slugNode.status === "draft" ? (
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-900">
                          Draft
                        </span>
                      ) : null}
                    </button>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

