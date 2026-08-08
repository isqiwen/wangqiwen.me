"use client";

import NextImage from "next/image";
import { Highlight, themes } from "prism-react-renderer";
import type { Language } from "prism-react-renderer";
import {
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type {
  ClipboardEvent,
  DragEvent,
  KeyboardEvent,
  ReactNode,
  RefObject,
} from "react";
import {
  componentsPalette,
  getComponentCategories,
  getComponentDefaultValues,
  isCoreComponent,
  renderComponentInsert,
  type ComponentSnippet,
  type ComponentSnippetField,
  type ComponentSnippetFormValue,
  type ComponentSnippetFormValues,
  type ComponentSnippetInsert,
  type ComponentSnippetRepeatableRow,
} from "./snippets";
import {
  parsePendingEditorSnippet,
  PENDING_EDITOR_SNIPPET_KEY,
} from "./pending-snippet";
import {
  parseExportedMetadata,
  stripExportedMetadata,
} from "@/utils/shared/post-metadata";
import { validateContentQuality } from "@/utils/shared/content-quality";
import { getUnknownTopics, TOPIC_DEFINITIONS } from "@/utils/topics";
import { SERIES_DEFINITIONS, isKnownSeries } from "@/utils/series";

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
  checks?: PublishReadinessCheck[];
};

type PublishReadinessStatus = "pass" | "warning" | "fail";

type PublishReadinessCheck = {
  label: string;
  detail: string;
  status: PublishReadinessStatus;
};

type EditorOutlineHeading = {
  level: 2 | 3 | 4;
  line: number;
  position: number;
  text: string;
};

type MdxFormattingAction =
  | "bold"
  | "link"
  | "inlineCode"
  | "codeBlock"
  | "quote"
  | "bulletList"
  | "orderedList"
  | "heading";

type EditorChangeSet = {
  available: boolean;
  diff: string;
};

type EditorChanges = {
  saved: EditorChangeSet;
  git: EditorChangeSet;
};

type ChangesView = "saved" | "git";

type EditorDocumentState = {
  title: string;
  description: string;
  summary: string;
  series: string;
  seriesOrder: string;
  publishedAt: string;
  updatedAt: string;
  id: string;
  status: EditorStatus;
  tagsInput: string;
  body: string;
};

type EditorWorkspaceSnapshot = EditorDocumentState & {
  activePath: string | null;
  targetPath: string;
};

type EditorLocalAutosave = EditorWorkspaceSnapshot & {
  version: 2;
  savedAt: number;
};

const MDX_FORMATTING_ACTIONS: Array<{
  action: MdxFormattingAction;
  label: string;
  shortcut?: string;
}> = [
  { action: "bold", label: "Bold", shortcut: "⌘/Ctrl+B" },
  { action: "link", label: "Link", shortcut: "⌘/Ctrl+K" },
  { action: "inlineCode", label: "Inline code" },
  { action: "codeBlock", label: "Code block" },
  { action: "quote", label: "Quote" },
  { action: "bulletList", label: "Bullet list" },
  { action: "orderedList", label: "Numbered list" },
  { action: "heading", label: "Heading 2" },
];

const LOCAL_AUTOSAVE_KEY = "mdx-editor.local-autosave.v2";
const LOCAL_AUTOSAVE_VERSION = 2;

function today() {
  return new Date().toISOString().slice(0, 10);
}

function buildTargetPath(publishedAt: string, id: string) {
  const year = publishedAt ? publishedAt.slice(0, 4) : "2025";
  return `app/(post)/${year}/${id}/article.mdx`;
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

function validateEditorContent(title: string, description: string) {
  if (!title.trim()) {
    return "Title is required.";
  }

  if (!description.trim()) {
    return "Description is required.";
  }

  return null;
}

function validateEditorSeries(series: string, seriesOrder: string) {
  const normalizedSeries = series.trim();
  const normalizedOrder = seriesOrder.trim();

  if (!normalizedSeries) {
    return normalizedOrder ? "A series position requires a series." : null;
  }

  if (!isKnownSeries(normalizedSeries)) {
    return "Choose a series from the catalog before saving.";
  }

  const position = Number(normalizedOrder);
  if (!Number.isInteger(position) || position < 1) {
    return "Series position must be a positive whole number.";
  }

  return null;
}

function createEmptyEditorDocument(): EditorDocumentState {
  return {
    title: "",
    description: "",
    summary: "",
    series: "",
    seriesOrder: "",
    publishedAt: today(),
    updatedAt: "",
    id: "my-post",
    status: "draft",
    tagsInput: "",
    body: "Start writing here.\n",
  };
}

function parseTagsInput(value: string): string[] {
  return Array.from(
    new Set(
      value
        .split(",")
        .map(item => item.trim())
        .filter(Boolean)
    )
  );
}

function serializeTopicSelection(selectedTopics: Set<string>): string {
  return TOPIC_DEFINITIONS.filter(topic => selectedTopics.has(topic.name))
    .map(topic => topic.name)
    .join(", ");
}

function normalizeAssetId(value: string) {
  const cleaned = value
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return cleaned || "misc";
}

function buildWorkspaceSnapshot(
  state: EditorDocumentState & { activePath: string | null }
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
      seriesOrder: number;
      publishedAt: string;
      updatedAt: string;
      id: string;
      status: EditorStatus;
      tags: string[];
    }>
  >(content);
}

function normalizeStatus(value: unknown): EditorStatus {
  if (value === "draft" || value === "published" || value === "archived") {
    return value;
  }

  return "draft";
}

function parseEditorDocument(
  content: string,
  filePath: string
): EditorDocumentState {
  const metadata = parseMetadataObject(content);
  const metadataTags = metadata?.tags;
  const body = stripExportedMetadata(content).trimStart();
  const slugFallback = filePath.split("/").at(-2) ?? "my-post";

  return {
    title: metadata?.title || "",
    description: metadata?.description || "",
    summary: metadata?.summary || "",
    series: metadata?.series || "",
    seriesOrder:
      typeof metadata?.seriesOrder === "number"
        ? String(metadata.seriesOrder)
        : "",
    publishedAt: metadata?.publishedAt || today(),
    updatedAt: metadata?.updatedAt || "",
    id: metadata?.id || slugFallback,
    status: normalizeStatus(metadata?.status),
    tagsInput: Array.isArray(metadataTags) ? metadataTags.join(", ") : "",
    body,
  };
}

function parseLocalAutosave(
  rawValue: string | null
): EditorLocalAutosave | null {
  if (!rawValue) {
    return null;
  }

  try {
    const parsed = JSON.parse(rawValue) as Partial<EditorLocalAutosave>;
    if (parsed?.version !== LOCAL_AUTOSAVE_VERSION) {
      return null;
    }

    if (
      typeof parsed.title !== "string" ||
      typeof parsed.description !== "string" ||
      typeof parsed.publishedAt !== "string" ||
      typeof parsed.id !== "string" ||
      typeof parsed.tagsInput !== "string" ||
      typeof parsed.body !== "string" ||
      typeof parsed.targetPath !== "string" ||
      typeof parsed.savedAt !== "number"
    ) {
      return null;
    }

    return {
      version: LOCAL_AUTOSAVE_VERSION,
      activePath:
        typeof parsed.activePath === "string" ? parsed.activePath : null,
      targetPath: parsed.targetPath,
      title: parsed.title,
      description: parsed.description,
      summary: typeof parsed.summary === "string" ? parsed.summary : "",
      series: typeof parsed.series === "string" ? parsed.series : "",
      seriesOrder:
        typeof parsed.seriesOrder === "string" ? parsed.seriesOrder : "",
      publishedAt: parsed.publishedAt,
      updatedAt: typeof parsed.updatedAt === "string" ? parsed.updatedAt : "",
      id: parsed.id,
      status: normalizeStatus(parsed.status),
      tagsInput: parsed.tagsInput,
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
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [summary, setSummary] = useState("");
  const [series, setSeries] = useState("");
  const [seriesOrder, setSeriesOrder] = useState("");
  const [publishedAt, setPublishedAt] = useState(today());
  const [updatedAt, setUpdatedAt] = useState("");
  const [id, setId] = useState("my-post");
  const [status, setStatus] = useState<EditorStatus>("draft");
  const [tagsInput, setTagsInput] = useState("");
  const [body, setBody] = useState("Start writing here.\n");
  const [fileOptions, setFileOptions] = useState<EditorFileOption[]>([]);
  const [activePath, setActivePath] = useState<string | null>(null);
  const [selectedPath, setSelectedPath] = useState("");
  const [showPicker, setShowPicker] = useState(false);
  const [feedback, setFeedback] = useState<EditorFeedback | null>(null);
  const [pickerFeedback, setPickerFeedback] = useState<EditorFeedback | null>(
    null
  );
  const [confirmation, setConfirmation] = useState<EditorConfirmation | null>(
    null
  );
  const [showChanges, setShowChanges] = useState(false);
  const [changes, setChanges] = useState<EditorChanges | null>(null);
  const [changesView, setChangesView] = useState<ChangesView>("saved");
  const [isChangesLoading, setIsChangesLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [assets, setAssets] = useState<EditorAsset[]>([]);
  const [isAssetsLoading, setIsAssetsLoading] = useState(false);
  const [deletingAssetPath, setDeletingAssetPath] = useState<string | null>(
    null
  );
  const [localAutosaveAt, setLocalAutosaveAt] = useState<number | null>(null);
  const editorRef = useRef<HTMLTextAreaElement | null>(null);
  const highlightedEditorRef = useRef<HTMLPreElement | null>(null);
  const assetInputRef = useRef<HTMLInputElement | null>(null);
  const restoredDraftRef = useRef(false);
  const pendingAutosaveRef = useRef<EditorLocalAutosave | null>(null);
  const handledPendingSnippetRef = useRef<number | null>(null);
  const confirmationResolveRef = useRef<((value: boolean) => void) | null>(
    null
  );
  const [cursorPos, setCursorPos] = useState<number>(body.length);
  const [selectionRange, setSelectionRange] = useState({
    start: body.length,
    end: body.length,
  });
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const deferredHighlightedBody = useDeferredValue(body);

  const workspaceSnapshot = useMemo(
    () =>
      buildWorkspaceSnapshot({
        activePath,
        title,
        description,
        summary,
        series,
        seriesOrder,
        publishedAt,
        updatedAt,
        id,
        status,
        tagsInput,
        body,
      }),
    [
      activePath,
      title,
      description,
      summary,
      series,
      seriesOrder,
      publishedAt,
      updatedAt,
      id,
      status,
      tagsInput,
      body,
    ]
  );
  const workspaceFingerprint = useMemo(
    () => serializeWorkspaceSnapshot(workspaceSnapshot),
    [workspaceSnapshot]
  );
  const [persistedFingerprint, setPersistedFingerprint] =
    useState(workspaceFingerprint);
  const currentStatus = status;
  const readingTimeEstimate = useMemo(
    () => estimateReadingTimeMinutes(body),
    [body]
  );
  const recentDrafts = useMemo(
    () =>
      [...fileOptions]
        .filter(file => file.status === "draft")
        .sort((a, b) => b.updatedAt - a.updatedAt)
        .slice(0, 5),
    [fileOptions]
  );
  const archivedPosts = useMemo(
    () =>
      [...fileOptions]
        .filter(file => file.status === "archived")
        .sort((a, b) => b.updatedAt - a.updatedAt)
        .slice(0, 5),
    [fileOptions]
  );
  const previewHref = useMemo(() => {
    const year = publishedAt ? publishedAt.slice(0, 4) : "2025";
    return `/${year}/${id}`;
  }, [publishedAt, id]);
  const assetFolderId = useMemo(() => normalizeAssetId(id), [id]);
  const isReadOnly = currentStatus === "archived";
  const canOpenPreview =
    currentStatus !== "archived" && activePath === workspaceSnapshot.targetPath;
  const isDirty = workspaceFingerprint !== persistedFingerprint;
  const targetPath = workspaceSnapshot.targetPath;
  const selectedTopics = useMemo(
    () => new Set(parseTagsInput(tagsInput)),
    [tagsInput]
  );
  const outlineHeadings = useMemo(() => extractOutlineHeadings(body), [body]);
  const headingIssues = useMemo(
    () =>
      getContentQualityIssues(body, new Set()).filter(issue =>
        issue.includes("heading")
      ),
    [body]
  );
  const publishReadiness = useMemo(
    () =>
      buildPublishReadiness({
        title,
        description,
        series,
        seriesOrder,
        publishedAt,
        id,
        tags: parseTagsInput(tagsInput),
        body,
        readingTimeEstimate,
        fileOptions,
      }),
    [
      title,
      description,
      series,
      seriesOrder,
      publishedAt,
      id,
      tagsInput,
      body,
      readingTimeEstimate,
      fileOptions,
    ]
  );

  const showFeedback = useCallback(
    (message: string, tone: FeedbackTone = "info") => {
      setFeedback({ message, tone });
    },
    []
  );

  const toggleTopic = useCallback((topicName: string) => {
    setTagsInput(current => {
      const nextTopics = new Set(parseTagsInput(current));
      if (nextTopics.has(topicName)) {
        nextTopics.delete(topicName);
      } else {
        nextTopics.add(topicName);
      }

      return serializeTopicSelection(nextTopics);
    });
  }, []);

  const showPickerFeedback = useCallback(
    (message: string, tone: FeedbackTone = "info") => {
      setPickerFeedback({ message, tone });
    },
    []
  );

  const clearPickerFeedback = useCallback(() => {
    setPickerFeedback(null);
  }, []);

  const requestConfirmation = useCallback(
    (nextConfirmation: EditorConfirmation) => {
      return new Promise<boolean>(resolve => {
        confirmationResolveRef.current = resolve;
        setConfirmation(nextConfirmation);
      });
    },
    []
  );

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
      seriesOrder,
      publishedAt,
      updatedAt,
      id,
      status,
      tagsInput,
      body,
    });
  }, [
    title,
    description,
    summary,
    series,
    seriesOrder,
    publishedAt,
    updatedAt,
    id,
    status,
    tagsInput,
    body,
  ]);

  const applyWorkspaceState = useCallback(
    (
      nextState: EditorDocumentState,
      options: {
        activePath?: string | null;
        markPersisted?: boolean;
      } = {}
    ) => {
      const nextActivePath = options.activePath ?? null;

      setTitle(nextState.title);
      setDescription(nextState.description);
      setSummary(nextState.summary);
      setSeries(nextState.series);
      setSeriesOrder(nextState.seriesOrder);
      setPublishedAt(nextState.publishedAt);
      setUpdatedAt(nextState.updatedAt);
      setId(nextState.id);
      setStatus(nextState.status);
      setTagsInput(nextState.tagsInput);
      setBody(nextState.body);
      setCursorPos(nextState.body.length);
      setSelectionRange({
        start: nextState.body.length,
        end: nextState.body.length,
      });
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
            })
          )
        );
      }
    },
    []
  );

  const restoreLocalAutosave = useCallback(
    (
      options: { matchingPath?: string | null; allowUnmatched?: boolean } = {}
    ) => {
      const autosave = pendingAutosaveRef.current;
      if (!autosave) {
        return false;
      }

      const matchesPath = options.matchingPath
        ? autosave.activePath === options.matchingPath ||
          autosave.targetPath === options.matchingPath
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
          seriesOrder: autosave.seriesOrder,
          publishedAt: autosave.publishedAt,
          updatedAt: autosave.updatedAt,
          id: autosave.id,
          status: autosave.status,
          tagsInput: autosave.tagsInput,
          body: autosave.body,
        },
        {
          activePath: autosave.activePath,
        }
      );
      setLocalAutosaveAt(autosave.savedAt);
      showFeedback(
        `Restored local autosave from ${formatUpdatedAt(autosave.savedAt)}`,
        "success"
      );
      return true;
    },
    [applyWorkspaceState, showFeedback]
  );

  const loadFromPath = useCallback(
    async (path: string, options: { successHint?: string } = {}) => {
      try {
        const res = await fetch(
          `/api/editor?path=${encodeURIComponent(path)}`,
          {
            cache: "no-store",
          }
        );

        if (res.status === 404) {
          showPickerFeedback("The selected file was not found.", "error");
          return false;
        }

        if (!res.ok) {
          throw new Error(
            await readResponseError(res, "Failed to read the selected file.")
          );
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
        const message =
          error instanceof Error
            ? error.message
            : "Failed to read the selected file.";
        showPickerFeedback(message, "error");
        showFeedback(message, "error");
        return false;
      }
    },
    [
      applyWorkspaceState,
      clearPickerFeedback,
      restoreLocalAutosave,
      showFeedback,
      showPickerFeedback,
    ]
  );

  const refreshFileList = useCallback(
    async (options: { autoRestoreLatestDraft?: boolean } = {}) => {
      try {
        const res = await fetch("/api/editor/list", {
          cache: "no-store",
        });

        if (!res.ok) {
          throw new Error(
            await readResponseError(res, "Failed to load the file list.")
          );
        }

        const data = (await res.json()) as {
          files?: EditorFileOption[];
        };
        const files = data.files ?? [];

        setFileOptions(files);
        setSelectedPath(current =>
          current && files.some(file => file.path === current)
            ? current
            : files[0]?.path ?? ""
        );
        setPickerFeedback(
          files.length === 0
            ? { message: "No files found.", tone: "info" }
            : null
        );

        if (!options.autoRestoreLatestDraft) {
          return;
        }

        const latestDraft = files.reduce<EditorFileOption | null>(
          (latest, file) => {
            if (file.status !== "draft") {
              return latest;
            }

            if (!latest || file.updatedAt > latest.updatedAt) {
              return file;
            }

            return latest;
          },
          null
        );

        if (latestDraft) {
          await loadFromPath(latestDraft.path, {
            successHint: `Restored latest draft: ${latestDraft.label}`,
          });
          return;
        }

        restoreLocalAutosave({ allowUnmatched: true });
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Failed to load the file list.";
        showPickerFeedback(message, "error");
      }
    },
    [loadFromPath, restoreLocalAutosave, showPickerFeedback]
  );

  const refreshAssets = useCallback(
    async (options: { silent?: boolean } = {}) => {
      setIsAssetsLoading(true);

      try {
        const res = await fetch(
          `/api/editor/assets?id=${encodeURIComponent(assetFolderId)}`,
          {
            cache: "no-store",
          }
        );

        if (!res.ok) {
          throw new Error(
            await readResponseError(res, "Failed to load assets.")
          );
        }

        const data = (await res.json()) as {
          assets?: EditorAsset[];
        };
        setAssets(Array.isArray(data.assets) ? data.assets : []);
      } catch (error) {
        if (!options.silent) {
          showFeedback(
            error instanceof Error ? error.message : "Failed to load assets.",
            "error"
          );
        }
      } finally {
        setIsAssetsLoading(false);
      }
    },
    [assetFolderId, showFeedback]
  );

  async function saveFile(
    options: {
      statusOverride?: EditorStatus;
      showHint?: boolean;
      successHint?: string;
    } = {}
  ) {
    try {
      const targetError = validateEditorTarget(publishedAt, id);
      if (targetError) {
        showFeedback(targetError, "error");
        return false;
      }

      const contentError = validateEditorContent(title, description);
      if (contentError) {
        showFeedback(contentError, "error");
        return false;
      }

      const seriesError = validateEditorSeries(series, seriesOrder);
      if (seriesError) {
        showFeedback(seriesError, "error");
        return false;
      }

      const nextStatus = options.statusOverride ?? status;
      const content = buildMdxContent({
        title,
        description,
        summary,
        series,
        seriesOrder,
        publishedAt,
        updatedAt,
        id,
        status: nextStatus,
        tagsInput,
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
        throw new Error(
          await readResponseError(
            res,
            "Save failed. Check the file path and permissions."
          )
        );
      }

      applyWorkspaceState(
        {
          title,
          description,
          summary,
          series,
          seriesOrder,
          publishedAt,
          updatedAt,
          id,
          status: nextStatus,
          tagsInput,
          body,
        },
        {
          activePath: targetPath,
          markPersisted: true,
        }
      );
      void refreshFileList();

      if (options.showHint !== false) {
        showFeedback(
          options.successHint ?? `Saved to ${targetPath}`,
          "success"
        );
      }

      return true;
    } catch (error) {
      if (options.showHint !== false) {
        showFeedback(
          error instanceof Error
            ? error.message
            : "Save failed. Check the file path and permissions.",
          "error"
        );
      }
      return false;
    }
  }

  async function openChanges() {
    if (!activePath) {
      showFeedback("Save this document once before comparing changes.", "info");
      return;
    }

    setShowChanges(true);
    setChanges(null);
    setChangesView("saved");
    setIsChangesLoading(true);

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
      setShowChanges(false);
      showFeedback(message, "error");
    } finally {
      setIsChangesLoading(false);
    }
  }

  async function publishPost() {
    const confirmed = await requestConfirmation({
      title: "Publish Post",
      description: `Mark "${title}" as published for the next deployment? It remains local until you commit and deploy.`,
      confirmLabel: "Publish",
      checks: publishReadiness,
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
        throw new Error(
          await readResponseError(res, "Publish failed. Check the server logs.")
        );
      }

      showFeedback(
        `Marked as published for the next deployment: ${targetPath}`,
        "success"
      );
    } catch (error) {
      showFeedback(
        error instanceof Error
          ? error.message
          : "Publish failed. Check the server logs.",
        "error"
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

  async function startNewDraft() {
    if (isDirty) {
      const confirmed = await requestConfirmation({
        title: "Discard unsaved changes?",
        description:
          "Start a new draft? Unsaved changes to the current document will be discarded.",
        confirmLabel: "Discard and start new",
        tone: "danger",
      });

      if (!confirmed) {
        return;
      }
    }

    if (typeof window !== "undefined") {
      window.localStorage.removeItem(LOCAL_AUTOSAVE_KEY);
    }
    pendingAutosaveRef.current = null;
    setLocalAutosaveAt(null);

    applyWorkspaceState(createEmptyEditorDocument(), {
      activePath: null,
      markPersisted: true,
    });
    setSelectedPath("");
    setShowPicker(false);
    showFeedback("Started a new draft.", "success");
  }

  async function deleteCurrentPost() {
    if (!activePath) {
      showFeedback("Save this document once before deleting it.", "info");
      return;
    }

    const confirmed = await requestConfirmation({
      title:
        currentStatus === "archived" ? "Delete Archived Post" : "Delete Draft",
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
        showFeedback(
          "Published posts must be archived before they can be deleted.",
          "error"
        );
        return;
      }

      if (!res.ok) {
        throw new Error(
          await readResponseError(
            res,
            "Delete failed. Check the file path and permissions."
          )
        );
      }

      if (typeof window !== "undefined") {
        window.localStorage.removeItem(LOCAL_AUTOSAVE_KEY);
      }
      pendingAutosaveRef.current = null;
      setLocalAutosaveAt(null);

      applyWorkspaceState(createEmptyEditorDocument(), {
        activePath: null,
        markPersisted: true,
      });
      setSelectedPath("");
      showFeedback(`Deleted: ${activePath}`, "success");
      await refreshFileList({ autoRestoreLatestDraft: true });
    } catch (error) {
      showFeedback(
        error instanceof Error
          ? error.message
          : "Delete failed. Check the file path and permissions.",
        "error"
      );
    }
  }

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    pendingAutosaveRef.current = parseLocalAutosave(
      window.localStorage.getItem(LOCAL_AUTOSAVE_KEY)
    );
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
    [body, cursorPos, isReadOnly]
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

      requestAnimationFrame(() => {
        const editor = editorRef.current;
        if (!editor) {
          return;
        }

        editor.focus();
        editor.setSelectionRange(next.selectionStart, next.selectionEnd);
      });
    },
    [body, isReadOnly, selectionRange]
  );

  const jumpToOutlineHeading = useCallback((heading: EditorOutlineHeading) => {
    const textarea = editorRef.current;
    if (!textarea) {
      return;
    }

    textarea.focus();
    textarea.setSelectionRange(heading.position, heading.position);
    textarea.scrollTop = Math.max(0, (heading.line - 3) * 24);
    setCursorPos(heading.position);
    setSelectionRange({ start: heading.position, end: heading.position });
  }, []);

  function handleEditorKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (isReadOnly || (!event.metaKey && !event.ctrlKey) || event.altKey) {
      return;
    }

    const key = event.key.toLowerCase();
    if (key === "b") {
      event.preventDefault();
      event.stopPropagation();
      applyMdxFormatting("bold");
    } else if (key === "k") {
      event.preventDefault();
      event.stopPropagation();
      applyMdxFormatting("link");
    }
  }

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
        if (
          options.removeAfterRead !== false &&
          typeof window !== "undefined"
        ) {
          window.localStorage.removeItem(PENDING_EDITOR_SNIPPET_KEY);
        }
        showFeedback(
          "The current post is read-only, so the queued component snippet was not inserted.",
          "error"
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
    [insertSnippet, isReadOnly, showFeedback]
  );

  useEffect(() => {
    if (typeof window === "undefined" || !initialLoadComplete) {
      return;
    }

    consumePendingEditorSnippet(
      window.localStorage.getItem(PENDING_EDITOR_SNIPPET_KEY)
    );
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
      showFeedback(
        "Archived posts are read-only. Restore to draft before editing.",
        "error"
      );
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
        throw new Error(
          resolveApiError(data, "Upload failed. Please try again.")
        );
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
        error instanceof Error
          ? error.message
          : "Upload failed. Please try again.",
        "error"
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
      showFeedback(
        "Archived posts are read-only. Restore to draft before editing.",
        "error"
      );
      return;
    }

    insertSnippet(
      buildImageSnippet({
        src: asset.path,
        width: asset.width,
        height: asset.height,
        alt: stripExtension(asset.name),
      })
    );
    showFeedback(`Inserted asset: ${asset.path}`, "success");
  }

  async function deleteAsset(asset: EditorAsset) {
    if (isReadOnly) {
      showFeedback(
        "Archived posts are read-only. Restore to draft before editing.",
        "error"
      );
      return;
    }

    const references = removeAssetReferencesFromBody(body, asset.path);
    const confirmed = await requestConfirmation({
      title: "Delete Asset",
      description:
        references.removed > 0
          ? `Delete asset "${asset.name}"? The current editor will also remove matching body references. Save the post afterward to persist those content changes.`
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
        throw new Error(
          await readResponseError(res, "Failed to delete asset.")
        );
      }

      setAssets(current =>
        current.filter(currentAsset => currentAsset.path !== asset.path)
      );
      if (references.removed > 0) {
        setBody(references.body);
        setCursorPos(current => Math.min(current, references.body.length));
      }
      showFeedback(
        references.removed > 0
          ? `Deleted asset and removed current editor references. Save the post to persist the content change.`
          : `Deleted asset: ${asset.path}`,
        "success"
      );
    } catch (error) {
      showFeedback(
        error instanceof Error ? error.message : "Failed to delete asset.",
        "error"
      );
    } finally {
      setDeletingAssetPath(null);
    }
  }

  return (
    <main
      aria-busy={!initialLoadComplete}
      className="flex w-screen max-w-none flex-col gap-6 px-4 py-8 lg:px-6"
      style={{ marginLeft: "calc(50% - 50vw)" }}
    >
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">MDX Editor</h1>
          <p className="text-sm text-slate-500">
            Save changes locally. Publishing marks an article for the next
            deployment; it does not deploy to the VPS.
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
          <button
            type="button"
            onClick={() => void openChanges()}
            disabled={!activePath}
            title={
              activePath
                ? "Compare editor, saved, and Git versions"
                : "Save this document once before comparing changes"
            }
            className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:border-slate-100 disabled:text-slate-300"
          >
            Changes
          </button>
          {currentStatus !== "archived" ? (
            <button
              onClick={() => void saveFile()}
              className="rounded-full bg-gray-900 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-gray-700"
            >
              {currentStatus === "draft"
                ? "Save Draft"
                : "Save Published Changes"}
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
          {(currentStatus === "draft" || currentStatus === "archived") &&
          activePath ? (
            <button
              onClick={deleteCurrentPost}
              className="rounded-full border border-rose-300 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-900 hover:bg-rose-100"
            >
              {currentStatus === "archived"
                ? "Delete Permanently"
                : "Delete Draft"}
            </button>
          ) : null}
          <button
            onClick={() => void startNewDraft()}
            className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            New Draft
          </button>
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
            Archived posts are read-only. Restore this post to draft before
            editing content or metadata.
          </div>
        ) : null}
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
          <Field label="Title" htmlFor="editor-title">
            <input
              id="editor-title"
              value={title}
              onChange={event => setTitle(event.target.value)}
              placeholder="A clear article title"
              className="rounded-md border border-slate-200 px-3 py-2 text-sm"
              disabled={isReadOnly}
            />
          </Field>
          <Field label="ID" htmlFor="editor-id">
            <input
              id="editor-id"
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
                  ? "Use Publish to include this article in the next deployment."
                  : currentStatus === "archived"
                  ? "Archived posts are read-only until you restore them."
                  : "Use Move To Draft for private editing or Archive to freeze and hide this article."}
              </span>
            </div>
          </Field>
          <Field
            label="Published At (YYYY-MM-DD)"
            htmlFor="editor-published-at"
          >
            <input
              id="editor-published-at"
              type="date"
              value={publishedAt}
              onChange={event => setPublishedAt(event.target.value)}
              className="rounded-md border border-slate-200 px-3 py-2 text-sm"
              disabled={isReadOnly}
            />
          </Field>
          <Field label="Updated At (optional)" htmlFor="editor-updated-at">
            <input
              id="editor-updated-at"
              type="date"
              value={updatedAt}
              onChange={event => setUpdatedAt(event.target.value)}
              className="rounded-md border border-slate-200 px-3 py-2 text-sm"
              disabled={isReadOnly}
            />
            <p className="mt-1 text-xs leading-5 text-slate-500">
              Set this only after a substantive published update. Leave it blank
              for drafts, first publication, and minor edits.
            </p>
          </Field>
          <Field label="Series" htmlFor="editor-series">
            <select
              id="editor-series"
              value={series}
              onChange={event => {
                setSeries(event.target.value);
                if (!event.target.value) {
                  setSeriesOrder("");
                }
              }}
              className="rounded-md border border-slate-200 px-3 py-2 text-sm"
              disabled={isReadOnly}
            >
              <option value="">Not part of a series</option>
              {SERIES_DEFINITIONS.map(definition => (
                <option key={definition.slug} value={definition.slug}>
                  {definition.title}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-slate-500">
              Series are defined in <code>content/series.json</code>.
            </p>
          </Field>
          {series ? (
            <Field label="Series Position" htmlFor="editor-series-position">
              <input
                id="editor-series-position"
                type="number"
                min="1"
                step="1"
                inputMode="numeric"
                value={seriesOrder}
                onChange={event => setSeriesOrder(event.target.value)}
                className="rounded-md border border-slate-200 px-3 py-2 text-sm"
                placeholder="1"
                disabled={isReadOnly}
              />
              <p className="mt-1 text-xs text-slate-500">
                Reading order within this series. Each position must be unique.
              </p>
            </Field>
          ) : null}
          <Field label="Topics">
            <div
              className="grid gap-2 sm:grid-cols-2"
              role="group"
              aria-label="Topics"
            >
              {TOPIC_DEFINITIONS.map(topic => {
                const checked = selectedTopics.has(topic.name);

                return (
                  <label
                    key={topic.slug}
                    className={`flex min-h-10 items-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors ${
                      checked
                        ? "border-slate-400 bg-slate-100 text-slate-900"
                        : "border-slate-200 text-slate-700"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleTopic(topic.name)}
                      disabled={isReadOnly}
                    />
                    {topic.name}
                  </label>
                );
              })}
            </div>
            <p className="mt-2 text-xs text-slate-500">
              Choose the topics for this article. Add a new topic in
              <code className="ml-1">content/topics.json</code> before using it.
            </p>
          </Field>
          <Field
            label="Search & sharing description"
            htmlFor="editor-description"
            spanFull
          >
            <input
              id="editor-description"
              value={description}
              onChange={event => setDescription(event.target.value)}
              placeholder="Required: concise text for search results and shared links"
              className="rounded-md border border-slate-200 px-3 py-2 text-sm"
              disabled={isReadOnly}
            />
          </Field>
          <Field
            label="Reader summary (optional)"
            htmlFor="editor-summary"
            spanFull
          >
            <textarea
              id="editor-summary"
              value={summary}
              onChange={event => setSummary(event.target.value)}
              className="min-h-24 rounded-md border border-slate-200 px-3 py-2 text-sm"
              placeholder="A reader-facing introduction for search, related posts, and series."
              disabled={isReadOnly}
            />
          </Field>
        </div>

        <div className="mt-4 flex flex-wrap gap-3 text-xs text-slate-500">
          <span>Target path: {targetPath}</span>
          <span>Estimated reading time: {readingTimeEstimate} min</span>
          <span>Current status: {currentStatus}</span>
          <span>
            {isDirty ? "Unsaved changes" : "All changes saved to disk"}
          </span>
          {localAutosaveAt ? (
            <span>Local autosave: {formatUpdatedAt(localAutosaveAt)}</span>
          ) : null}
          {currentStatus !== "archived" && !canOpenPreview ? (
            <span>Save the current path once to enable preview.</span>
          ) : null}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-[1.4fr_1fr]">
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
                <span className="text-xs text-slate-400">
                  Uploading image...
                </span>
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
                  onClick={() => applyMdxFormatting(formattingAction.action)}
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
              source={deferredHighlightedBody}
              scrollRef={highlightedEditorRef}
            />
            <textarea
              id="editor-body"
              ref={editorRef}
              value={body}
              onChange={event => {
                setBody(event.target.value);
                setCursorPos(
                  event.target.selectionStart ?? event.target.value.length
                );
                setSelectionRange({
                  start:
                    event.target.selectionStart ?? event.target.value.length,
                  end: event.target.selectionEnd ?? event.target.value.length,
                });
              }}
              onSelect={event => {
                const target = event.target as HTMLTextAreaElement;
                setCursorPos(target.selectionStart ?? 0);
                setSelectionRange({
                  start: target.selectionStart ?? 0,
                  end: target.selectionEnd ?? 0,
                });
              }}
              onScroll={event => {
                const highlightedEditor = highlightedEditorRef.current;
                if (highlightedEditor) {
                  highlightedEditor.scrollTop = event.currentTarget.scrollTop;
                  highlightedEditor.scrollLeft = event.currentTarget.scrollLeft;
                }
              }}
              onKeyDown={handleEditorKeyDown}
              onDrop={handleDrop}
              onDragOver={event => event.preventDefault()}
              onPaste={handlePaste}
              className="col-start-1 row-start-1 min-h-[800px] w-full resize-y rounded-md bg-transparent px-3 py-2 font-mono text-sm leading-6 text-transparent caret-slate-900 outline-none selection:bg-sky-200/80 selection:text-transparent disabled:cursor-not-allowed disabled:bg-slate-100"
              spellCheck={false}
              disabled={isReadOnly}
            />
          </div>
        </div>

        <div className="space-y-4">
          <aside
            className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
            aria-labelledby="article-outline-heading"
          >
            <div>
              <h2
                id="article-outline-heading"
                className="text-sm font-semibold text-slate-700"
              >
                Article Outline
              </h2>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                Built from <code>##</code>, <code>###</code>, and <code>####</code> headings. Select
                one to move the editor cursor there.
              </p>
            </div>

            {outlineHeadings.length > 0 ? (
              <nav className="mt-3" aria-label="Article outline">
                <ol className="space-y-1">
                  {outlineHeadings.map(heading => (
                    <li key={`${heading.line}-${heading.text}`}>
                      <button
                        type="button"
                        onClick={() => jumpToOutlineHeading(heading)}
                        className={`flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm text-slate-700 hover:bg-slate-50 ${
                          heading.level === 3
                            ? "pl-6"
                            : heading.level === 4
                              ? "pl-10"
                              : ""
                        }`}
                      >
                        <span className="font-mono text-[10px] text-slate-400">
                          H{heading.level}
                        </span>
                        <span className="min-w-0 truncate">{heading.text}</span>
                      </button>
                    </li>
                  ))}
                </ol>
              </nav>
            ) : (
              <p className="mt-3 rounded-lg border border-dashed border-slate-200 bg-slate-50 px-3 py-2 text-xs leading-5 text-slate-500">
                Add a <code>##</code> heading to start an outline.
              </p>
            )}

            {headingIssues.length > 0 ? (
              <div
                className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs leading-5 text-rose-800"
                role="alert"
              >
                <p className="font-semibold">Fix heading hierarchy</p>
                <ul className="mt-1 list-disc space-y-1 pl-4">
                  {headingIssues.map(issue => (
                    <li key={issue}>{issue}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </aside>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold text-slate-700">
                  Image Assets
                </h2>
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Assets are grouped by post ID in{" "}
                  <code>/public/images/{assetFolderId}</code>. Existing files
                  stay in their current folder if you later rename the post ID.
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
              <span>
                {assets.length} asset{assets.length === 1 ? "" : "s"}
              </span>
            </div>

            {assets.length === 0 ? (
              <div className="mt-4 rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-sm text-slate-500">
                No uploaded images yet. Upload here, drag an image into the
                editor, or paste one from the clipboard.
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
                        </div>
                        <p className="mt-1 truncate font-mono text-[11px] text-slate-500">
                          {asset.path}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-3 text-[11px] text-slate-500">
                          <span>{formatFileSize(asset.size)}</span>
                          <span>
                            Updated {formatUpdatedAt(asset.updatedAt)}
                          </span>
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
                        disabled={
                          isReadOnly || deletingAssetPath === asset.path
                        }
                        className="rounded-full border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-50 disabled:cursor-not-allowed disabled:border-rose-100 disabled:bg-white/60 disabled:text-rose-300"
                      >
                        {deletingAssetPath === asset.path
                          ? "Deleting..."
                          : "Delete"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-700">
              Component Library
            </h2>
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
                <h3 className="text-sm font-semibold text-slate-800">
                  Select File
                </h3>
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
                    {recentDrafts.length === 0
                      ? "No saved drafts"
                      : `${recentDrafts.length} shown`}
                  </div>
                </div>
                {recentDrafts.length === 0 ? (
                  <div className="rounded-md border border-dashed border-slate-200 bg-slate-50 px-3 py-2 text-[11px] text-slate-400">
                    Save a draft once and it will appear here for one-click
                    restore.
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
                        <span className="shrink-0 text-[11px] text-slate-400">
                          Open
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {fileOptions.length === 0 ? (
                <div className="text-slate-400">
                  No files found. Confirm that app/(post)/YEAR/slug/article.mdx
                  exists.
                </div>
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
                    {archivedPosts.length === 0
                      ? "No archived posts"
                      : `${archivedPosts.length} shown`}
                  </div>
                </div>
                {archivedPosts.length === 0 ? (
                  <div className="rounded-md border border-dashed border-slate-200 bg-slate-50 px-3 py-2 text-[11px] text-slate-400">
                    Archived posts stay here for read-only review or restore
                    later.
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
                        <span className="shrink-0 text-[11px] text-slate-400">
                          Open
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            {pickerFeedback ? (
              <div
                className={`mt-2 text-[11px] ${
                  pickerFeedback.tone === "error"
                    ? "text-rose-500"
                    : "text-slate-500"
                }`}
              >
                {pickerFeedback.message}
              </div>
            ) : null}
            <div className="mt-2 text-[11px] text-slate-500">
              Draft and archived posts are marked with badges. Only drafts are
              eligible for automatic restore.
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

      {showChanges ? (
        <ChangesDialog
          changes={changes}
          view={changesView}
          isLoading={isChangesLoading}
          onClose={() => setShowChanges(false)}
          onViewChange={setChangesView}
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

function buildMdxContent({
  title,
  description,
  summary,
  series,
  seriesOrder,
  publishedAt,
  updatedAt,
  id,
  status,
  tagsInput,
  body,
}: {
  title: string;
  description: string;
  summary: string;
  series: string;
  seriesOrder: string;
  publishedAt: string;
  updatedAt: string;
  id: string;
  status: EditorStatus;
  tagsInput: string;
  body: string;
}) {
  const metadata = buildMetadataObject({
    title,
    description,
    summary,
    series,
    seriesOrder,
    publishedAt,
    updatedAt,
    id,
    status,
    tagsInput,
  });

  return `export const metadata = ${JSON.stringify(
    metadata,
    null,
    2
  )};\n\n${body.trim()}\n`;
}

function extractOutlineHeadings(source: string): EditorOutlineHeading[] {
  const headings: EditorOutlineHeading[] = [];
  let inCodeFence = false;
  let position = 0;

  for (const [index, line] of source.split("\n").entries()) {
    if (/^\s*```/.test(line)) {
      inCodeFence = !inCodeFence;
    } else if (!inCodeFence) {
      const match = line.match(/^(#{2,4})\s+(.+?)\s*#*\s*$/);
      if (match) {
        const text = match[2].trim();
        if (text) {
          headings.push({
            level: match[1].length as 2 | 3 | 4,
            line: index + 1,
            position,
            text,
          });
        }
      }
    }

    position += line.length + 1;
  }

  return headings;
}

function getContentQualityIssues(source: string, articlePaths: Set<string>) {
  return validateContentQuality(source, { articlePaths }) as string[];
}

function buildPublishReadiness({
  title,
  description,
  series,
  seriesOrder,
  publishedAt,
  id,
  tags,
  body,
  readingTimeEstimate,
  fileOptions,
}: {
  title: string;
  description: string;
  series: string;
  seriesOrder: string;
  publishedAt: string;
  id: string;
  tags: string[];
  body: string;
  readingTimeEstimate: number;
  fileOptions: EditorFileOption[];
}): PublishReadinessCheck[] {
  const targetError = validateEditorTarget(publishedAt, id);
  const seriesError = validateEditorSeries(series, seriesOrder);
  const unknownTopics = getUnknownTopics(tags);
  const articlePaths = new Set(
    fileOptions
      .filter(file => file.status === "published")
      .flatMap(file => {
        const routePath = getRoutePathFromPostFile(file.path);
        return routePath ? [routePath] : [];
      })
  );

  if (!targetError) {
    articlePaths.add(`/${publishedAt.slice(0, 4)}/${id}`);
  }

  const contentIssues = getContentQualityIssues(body, articlePaths);
  const imageIssues = contentIssues.filter(issue =>
    issue.includes("image is missing alt text")
  );
  const headingIssues = contentIssues.filter(issue =>
    issue.includes("heading")
  );
  const linkIssues = contentIssues.filter(issue =>
    issue.includes("internal article link")
  );

  return [
    createPublishReadinessCheck(
      "Article ID and published date",
      targetError ?? `Will publish at /${publishedAt.slice(0, 4)}/${id}`,
      targetError ? "fail" : "pass"
    ),
    createPublishReadinessCheck(
      "Title",
      title.trim() ? "Title is set." : "A title is required.",
      title.trim() ? "pass" : "fail"
    ),
    createPublishReadinessCheck(
      "Description",
      description.trim()
        ? "Search and sharing description is set."
        : "A search and sharing description is required.",
      description.trim() ? "pass" : "fail"
    ),
    createPublishReadinessCheck(
      "Topics",
      unknownTopics.length > 0
        ? `Unknown topics: ${unknownTopics.join(", ")}.`
        : tags.length > 0
        ? `${tags.length} topic${tags.length === 1 ? "" : "s"} selected.`
        : "No topic selected. Topics are recommended but optional.",
      unknownTopics.length > 0 ? "fail" : tags.length > 0 ? "pass" : "warning"
    ),
    createPublishReadinessCheck(
      "Series position",
      seriesError ??
        (series
          ? `Part ${seriesOrder} in ${series}.`
          : "Not part of a series."),
      seriesError ? "fail" : "pass"
    ),
    createPublishReadinessCheck(
      "Image alt text",
      imageIssues.length > 0
        ? imageIssues.join(" ")
        : "All images have alt text.",
      imageIssues.length > 0 ? "fail" : "pass"
    ),
    createPublishReadinessCheck(
      "Heading hierarchy",
      headingIssues.length > 0
        ? headingIssues.join(" ")
        : "Heading levels are valid.",
      headingIssues.length > 0 ? "fail" : "pass"
    ),
    createPublishReadinessCheck(
      "Internal article links",
      linkIssues.length > 0
        ? linkIssues.join(" ")
        : "All internal article links resolve.",
      linkIssues.length > 0 ? "fail" : "pass"
    ),
    createPublishReadinessCheck(
      "Estimated reading time",
      `${readingTimeEstimate} min read.`,
      "pass"
    ),
  ];
}

function createPublishReadinessCheck(
  label: string,
  detail: string,
  status: PublishReadinessStatus
): PublishReadinessCheck {
  return { label, detail, status };
}

function getRoutePathFromPostFile(filePath: string) {
  const match = filePath.match(
    /^app\/\(post\)\/(\d{4})\/([a-z0-9]+(?:-[a-z0-9]+)*)\/article\.mdx$/
  );
  return match ? `/${match[1]}/${match[2]}` : null;
}

function formatMdxSelection(
  source: string,
  selectionStart: number,
  selectionEnd: number,
  action: MdxFormattingAction
) {
  const start = Math.max(0, Math.min(selectionStart, source.length));
  const end = Math.max(start, Math.min(selectionEnd, source.length));
  const selected = source.slice(start, end);

  if (action === "bold") {
    const value = selected || "bold text";
    return replaceMdxRange(
      source,
      start,
      end,
      `**${value}**`,
      2,
      2 + value.length
    );
  }

  if (action === "link") {
    const label = selected || "link text";
    const href = "https://";
    return replaceMdxRange(
      source,
      start,
      end,
      `[${label}](${href})`,
      label.length + 3,
      label.length + 3 + href.length
    );
  }

  if (action === "inlineCode") {
    const value = selected || "code";
    return replaceMdxRange(
      source,
      start,
      end,
      `\`${value}\``,
      1,
      1 + value.length
    );
  }

  if (action === "codeBlock") {
    const value = selected || "code";
    return replaceMdxRange(
      source,
      start,
      end,
      `\`\`\`\n${value}\n\`\`\``,
      4,
      4 + value.length
    );
  }

  if (action === "heading") {
    const lineStart = source.lastIndexOf("\n", Math.max(0, start - 1)) + 1;
    const nextLineBreak = source.indexOf("\n", end);
    const lineEnd = nextLineBreak === -1 ? source.length : nextLineBreak;
    const rangeStart = selected ? start : lineStart;
    const rangeEnd = selected ? end : lineEnd;
    const value =
      (selected || source.slice(lineStart, lineEnd))
        .replace(/^\s*#{1,6}\s+/, "")
        .trim() || "Section title";

    return replaceMdxRange(
      source,
      rangeStart,
      rangeEnd,
      `## ${value}`,
      3,
      3 + value.length
    );
  }

  const value = selected || (action === "quote" ? "Quote" : "List item");
  const prefix =
    action === "quote" ? "> " : action === "bulletList" ? "- " : "1. ";
  const formatted = value
    .split("\n")
    .map(line => `${prefix}${line}`)
    .join("\n");

  return replaceMdxRange(
    source,
    start,
    end,
    formatted,
    prefix.length,
    formatted.length
  );
}

function replaceMdxRange(
  source: string,
  start: number,
  end: number,
  replacement: string,
  selectionStartOffset: number,
  selectionEndOffset: number
) {
  return {
    source: `${source.slice(0, start)}${replacement}${source.slice(end)}`,
    selectionStart: start + selectionStartOffset,
    selectionEnd: start + selectionEndOffset,
  };
}

function buildMetadataObject({
  title,
  description,
  summary,
  series,
  seriesOrder,
  publishedAt,
  updatedAt,
  id,
  status,
  tagsInput,
}: {
  title: string;
  description: string;
  summary: string;
  series: string;
  seriesOrder: string;
  publishedAt: string;
  updatedAt: string;
  id: string;
  status: EditorStatus;
  tagsInput: string;
}) {
  const tags = parseTagsInput(tagsInput);

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
    metadata.seriesOrder = Number(seriesOrder);
  }

  if (updatedAt.trim()) {
    metadata.updatedAt = updatedAt.trim();
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
      "g"
    ),
    new RegExp(
      String.raw`!\[[^\]]*]\(${escapedPath.replace(
        /\//g,
        "\\/"
      )}(?:\s+["'][^"']*["'])?\)`,
      "g"
    ),
    new RegExp(String.raw`<img\b[^>]*src=(["'])${escapedPath}\1[^>]*\/?>`, "g"),
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

  return `${
    value >= 10 || unitIndex === 0 ? value.toFixed(0) : value.toFixed(1)
  } ${units[unitIndex]}`;
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

function isEditorChanges(
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

function ChangesDialog({
  changes,
  view,
  isLoading,
  onClose,
  onViewChange,
}: {
  changes: EditorChanges | null;
  view: ChangesView;
  isLoading: boolean;
  onClose: () => void;
  onViewChange: (view: ChangesView) => void;
}) {
  const changeSet = changes?.[view];
  const description =
    view === "saved"
      ? "Current editor content compared with the MDX file saved on disk."
      : "The MDX file saved on disk compared with Git HEAD.";
  const emptyMessage =
    view === "saved"
      ? "No unsaved changes."
      : "The saved MDX file matches Git HEAD.";

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/45 px-4 py-8">
      <section
        aria-labelledby="editor-changes-heading"
        aria-modal="true"
        role="dialog"
        className="flex max-h-full w-full max-w-5xl flex-col rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl"
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <p className="font-mono text-xs uppercase tracking-[0.25em] text-slate-500">
              Version comparison
            </p>
            <h3
              id="editor-changes-heading"
              className="text-xl font-semibold text-slate-900"
            >
              Changes
            </h3>
            <p className="text-sm leading-6 text-slate-600">{description}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Close
          </button>
        </div>

        <div
          className="mt-5 flex flex-wrap gap-2"
          role="group"
          aria-label="Comparison baseline"
        >
          <button
            type="button"
            onClick={() => onViewChange("saved")}
            aria-pressed={view === "saved"}
            className={`rounded-full px-4 py-2 text-sm font-semibold ${
              view === "saved"
                ? "bg-slate-900 text-white"
                : "border border-slate-200 text-slate-700 hover:bg-slate-50"
            }`}
          >
            Current editor vs saved file
          </button>
          <button
            type="button"
            onClick={() => onViewChange("git")}
            aria-pressed={view === "git"}
            className={`rounded-full px-4 py-2 text-sm font-semibold ${
              view === "git"
                ? "bg-slate-900 text-white"
                : "border border-slate-200 text-slate-700 hover:bg-slate-50"
            }`}
          >
            Saved file vs Git HEAD
          </button>
        </div>

        <div className="mt-4 min-h-40 overflow-auto rounded-xl border border-slate-200 bg-slate-950 p-4">
          {isLoading ? (
            <p className="text-sm text-slate-300">Loading changes…</p>
          ) : !changeSet?.available ? (
            <p className="text-sm text-slate-300">
              Save this document once before comparing changes.
            </p>
          ) : changeSet.diff ? (
            <DiffOutput diff={changeSet.diff} />
          ) : (
            <p className="text-sm text-slate-300">{emptyMessage}</p>
          )}
        </div>
      </section>
    </div>
  );
}

function DiffOutput({ diff }: { diff: string }) {
  const lines = diff.split("\n");

  return (
    <pre
      aria-label="MDX diff"
      className="whitespace-pre-wrap break-words font-mono text-xs leading-6 text-slate-100"
    >
      {lines.map((line, index) => (
        <span key={`${index}-${line}`} className={getDiffLineClassName(line)}>
          {line || " "}
        </span>
      ))}
    </pre>
  );
}

function MdxSyntaxHighlight({
  source,
  scrollRef,
}: {
  source: string;
  scrollRef: RefObject<HTMLPreElement | null>;
}) {
  return (
    <Highlight
      theme={themes.github}
      code={source}
      language={"markdown" as Language}
    >
      {({ style, tokens, getLineProps, getTokenProps }) => (
        <pre
          ref={scrollRef}
          aria-hidden="true"
          data-testid="mdx-syntax-highlight"
          className="pointer-events-none col-start-1 row-start-1 m-0 min-h-[800px] overflow-hidden whitespace-pre-wrap break-words bg-transparent px-3 py-2 font-mono text-sm leading-6"
          style={{ ...style, backgroundColor: "transparent" }}
        >
          {tokens.map((line, lineIndex) => {
            const lineProps = getLineProps({ line });

            return (
              <div
                key={lineIndex}
                {...lineProps}
                className={`${lineProps.className ?? ""} min-h-6`}
              >
                {line.map((token, tokenIndex) => {
                  const tokenProps = getTokenProps({ token });
                  return <span key={tokenIndex} {...tokenProps} />;
                })}
              </div>
            );
          })}
        </pre>
      )}
    </Highlight>
  );
}

function getDiffLineClassName(line: string) {
  if (line.startsWith("+++")) {
    return "block bg-emerald-950/70 px-2 text-emerald-200";
  }

  if (line.startsWith("---")) {
    return "block bg-rose-950/70 px-2 text-rose-200";
  }

  if (line.startsWith("@@")) {
    return "block bg-sky-950/70 px-2 text-sky-200";
  }

  if (line.startsWith("+")) {
    return "block bg-emerald-950/40 px-2 text-emerald-100";
  }

  if (line.startsWith("-")) {
    return "block bg-rose-950/40 px-2 text-rose-100";
  }

  if (
    line.startsWith("diff ") ||
    line.startsWith("index ") ||
    line.startsWith("new file ")
  ) {
    return "block px-2 text-slate-400";
  }

  return "block px-2 text-slate-200";
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
  const hasBlockingCheck = confirmation.checks?.some(
    check => check.status === "fail"
  );

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto bg-slate-950/45 p-4">
      <section
        aria-labelledby="editor-confirmation-heading"
        aria-modal="true"
        role="dialog"
        className="my-auto flex max-h-[calc(100vh-2rem)] w-full max-w-2xl flex-col rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl"
      >
        <div className="space-y-2">
          <p className="font-mono text-xs uppercase tracking-[0.25em] text-slate-500">
            Confirm Action
          </p>
          <h3
            id="editor-confirmation-heading"
            className="text-xl font-semibold text-slate-900"
          >
            {confirmation.title}
          </h3>
          <p className="text-sm leading-6 text-slate-600">
            {confirmation.description}
          </p>
        </div>

        {confirmation.checks ? (
          <div className="mt-5 min-h-0 overflow-y-auto rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h4 className="text-sm font-semibold text-slate-800">
                Publish readiness
              </h4>
              <span className="text-xs text-slate-500">
                {hasBlockingCheck
                  ? "Resolve required items before publishing."
                  : "Ready to publish."}
              </span>
            </div>
            <ul className="mt-3 space-y-2">
              {confirmation.checks.map(check => (
                <li
                  key={check.label}
                  className="flex items-start gap-2 rounded-lg bg-white px-3 py-2 text-xs"
                >
                  <span
                    aria-label={
                      check.status === "pass"
                        ? "Passed"
                        : check.status === "warning"
                        ? "Recommended"
                        : "Needs attention"
                    }
                    className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                      check.status === "pass"
                        ? "bg-emerald-100 text-emerald-800"
                        : check.status === "warning"
                        ? "bg-amber-100 text-amber-800"
                        : "bg-rose-100 text-rose-800"
                    }`}
                  >
                    {check.status === "pass"
                      ? "✓"
                      : check.status === "warning"
                      ? "!"
                      : "×"}
                  </span>
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-700">
                      {check.label}
                    </p>
                    <p className="mt-0.5 leading-5 text-slate-500">
                      {check.detail}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className="mt-6 flex shrink-0 flex-wrap justify-end gap-2">
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
            disabled={hasBlockingCheck}
            className={`rounded-full px-4 py-2 text-sm font-semibold text-white shadow ${
              confirmation.tone === "danger"
                ? "bg-rose-600 hover:bg-rose-500"
                : "bg-slate-900 hover:bg-slate-700"
            } disabled:cursor-not-allowed disabled:bg-slate-300`}
          >
            {confirmation.confirmLabel}
          </button>
        </div>
      </section>
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
  htmlFor,
  children,
  spanFull,
}: {
  label: string;
  htmlFor?: string;
  children: ReactNode;
  spanFull?: boolean;
}) {
  return (
    <div
      className={`flex flex-col gap-1 ${
        spanFull ? "md:col-span-2 lg:col-span-4" : ""
      }`}
    >
      <label htmlFor={htmlFor} className="text-xs font-semibold text-slate-600">
        {label}
      </label>
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
  const [query, setQuery] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [activeCategory, setActiveCategory] = useState("All");
  const [selectedComponentId, setSelectedComponentId] = useState<string | null>(
    null
  );
  const [formValues, setFormValues] = useState<ComponentSnippetFormValues>({});

  const normalizedQuery = query.trim().toLowerCase();
  const isSearching = normalizedQuery.length > 0;
  const coreEntries = useMemo(
    () => componentsPalette.filter(isCoreComponent),
    []
  );
  const visibleEntries =
    showAdvanced || isSearching ? componentsPalette : coreEntries;
  const categories = useMemo(
    () => ["All", ...getComponentCategories(visibleEntries)],
    [visibleEntries]
  );
  const effectiveActiveCategory = categories.includes(activeCategory)
    ? activeCategory
    : "All";

  const filteredEntries = useMemo(() => {
    return visibleEntries.filter(entry => {
      if (
        effectiveActiveCategory !== "All" &&
        entry.category !== effectiveActiveCategory
      ) {
        return false;
      }

      if (!normalizedQuery) {
        return true;
      }

      const haystack = [
        entry.label,
        entry.hint,
        entry.category,
        ...(entry.searchTerms ?? []),
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(normalizedQuery);
    });
  }, [effectiveActiveCategory, normalizedQuery, visibleEntries]);
  const grouped = useMemo(
    () => groupComponentSnippets(filteredEntries),
    [filteredEntries]
  );
  const selectedEntry = useMemo(
    () =>
      componentsPalette.find(entry => entry.id === selectedComponentId) ?? null,
    [selectedComponentId]
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

  function updateFormValue(fieldId: string, value: ComponentSnippetFormValue) {
    setFormValues(current => ({
      ...current,
      [fieldId]: value,
    }));
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="text-xs font-semibold text-slate-600">
            Insert component
          </div>
          <div className="text-[11px] text-slate-500">
            Start with the writing essentials. Search includes the full catalog,
            and advanced components stay available when you need them.
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
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
            {showAdvanced || isSearching
              ? `${componentsPalette.length} components available`
              : `${coreEntries.length} writing essentials`}
          </div>
          <button
            type="button"
            data-testid="advanced-components-toggle"
            aria-pressed={showAdvanced}
            onClick={() => setShowAdvanced(current => !current)}
            className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
          >
            {showAdvanced
              ? "Show writing essentials"
              : `Show ${
                  componentsPalette.length - coreEntries.length
                } advanced components`}
          </button>
        </div>
        <input
          type="search"
          value={query}
          onChange={event => setQuery(event.target.value)}
          placeholder="Search all components, patterns, or props"
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm placeholder:text-slate-400"
        />
        <div className="flex flex-wrap gap-2">
          {categories.map(category => {
            const isActive = category === effectiveActiveCategory;
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
          {filteredEntries.length} component
          {filteredEntries.length === 1 ? "" : "s"} match the current filters
          {isSearching && !showAdvanced
            ? ", including advanced components"
            : ""}
          .
        </div>
      </div>

      {selectedEntry?.fields?.length && configuredSnippet ? (
        <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="font-semibold text-slate-900">
                {selectedEntry.label}
              </div>
              <div className="mt-1 text-sm text-slate-600">
                {selectedEntry.hint}
              </div>
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
              onClick={() =>
                setFormValues(getComponentDefaultValues(selectedEntry))
              }
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
            No components match the current search. Try another keyword or
            switch categories.
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
                        <div className="font-semibold text-slate-900">
                          {item.label}
                        </div>
                        <div className="mt-1 text-[11px] text-slate-500">
                          {item.hint}
                        </div>
                      </div>
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
  value: ComponentSnippetFormValue | undefined;
  disabled?: boolean;
  onChange: (value: ComponentSnippetFormValue) => void;
}) {
  const baseInputClass =
    "w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm placeholder:text-slate-400";

  return (
    <div className="space-y-1">
      <label className="text-xs font-semibold text-slate-600">
        {field.label}
      </label>

      {field.type === "repeatable" ? (
        <RepeatableConfiguratorField
          field={field}
          value={Array.isArray(value) ? value : []}
          disabled={disabled}
          onChange={onChange}
        />
      ) : field.type === "textarea" ? (
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

      {field.help ? (
        <p className="text-[11px] text-slate-500">{field.help}</p>
      ) : null}
    </div>
  );
}

function RepeatableConfiguratorField({
  field,
  value,
  disabled,
  onChange,
}: {
  field: ComponentSnippetField;
  value: ComponentSnippetRepeatableRow[];
  disabled?: boolean;
  onChange: (value: ComponentSnippetRepeatableRow[]) => void;
}) {
  const itemFields = field.itemFields ?? [];
  const minItems = field.minItems ?? 0;
  const baseInputClass =
    "w-full rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-sm text-slate-700 shadow-sm placeholder:text-slate-400";

  function createRow(): ComponentSnippetRepeatableRow {
    return itemFields.reduce<ComponentSnippetRepeatableRow>(
      (row, itemField) => {
        row[itemField.id] = itemField.defaultValue ?? "";
        return row;
      },
      {}
    );
  }

  function updateRow(index: number, fieldId: string, nextValue: string) {
    onChange(
      value.map((row, rowIndex) =>
        rowIndex === index ? { ...row, [fieldId]: nextValue } : row
      )
    );
  }

  function moveRow(index: number, direction: -1 | 1) {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= value.length) {
      return;
    }

    const next = [...value];
    [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
    onChange(next);
  }

  return (
    <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
      {value.map((row, index) => (
        <div
          key={`${field.id}-${index}`}
          className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm"
        >
          <div className="mb-2 flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-slate-600">
              {field.itemLabel ?? "Item"} {index + 1}
            </span>
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => moveRow(index, -1)}
                disabled={disabled || index === 0}
                aria-label={`Move ${field.itemLabel ?? "item"} ${index + 1} up`}
                className="rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-300"
              >
                ↑
              </button>
              <button
                type="button"
                onClick={() => moveRow(index, 1)}
                disabled={disabled || index === value.length - 1}
                aria-label={`Move ${field.itemLabel ?? "item"} ${
                  index + 1
                } down`}
                className="rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-300"
              >
                ↓
              </button>
              <button
                type="button"
                onClick={() =>
                  onChange(value.filter((_, rowIndex) => rowIndex !== index))
                }
                disabled={disabled || value.length <= minItems}
                aria-label={`Remove ${field.itemLabel ?? "item"} ${index + 1}`}
                className="rounded-md border border-rose-200 px-2 py-1 text-xs text-rose-700 hover:bg-rose-50 disabled:cursor-not-allowed disabled:border-slate-100 disabled:text-slate-300"
              >
                Remove
              </button>
            </div>
          </div>
          <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_5rem_minmax(0,0.8fr)]">
            {itemFields.map(itemField => (
              <label key={itemField.id} className="space-y-1">
                <span className="text-[11px] font-semibold text-slate-500">
                  {itemField.label}
                </span>
                <input
                  type="text"
                  value={row[itemField.id] ?? ""}
                  onChange={event =>
                    updateRow(index, itemField.id, event.target.value)
                  }
                  placeholder={itemField.placeholder}
                  disabled={disabled}
                  className={baseInputClass}
                />
              </label>
            ))}
          </div>
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange([...value, createRow()])}
        disabled={disabled}
        className="rounded-lg border border-dashed border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:border-slate-400 hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-300"
      >
        {field.addLabel ?? "Add item"}
      </button>
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
          <div
            key={yearKey}
            className="rounded-md border border-slate-200 bg-white p-2"
          >
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
