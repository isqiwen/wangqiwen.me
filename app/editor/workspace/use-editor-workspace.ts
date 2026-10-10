import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { estimateReadingTimeMinutes } from "@/utils/shared/post-fields";
import type { SaveConflict } from "../save-conflict";
import { readResponseError } from "./api";
import {
  buildMdxContent,
  buildWorkspaceSnapshot,
  createEmptyEditorDocument,
  LOCAL_AUTOSAVE_KEY,
  LOCAL_AUTOSAVE_VERSION,
  parseEditorDocument,
  parseLocalAutosave,
  parseTagsInput,
  serializeTopicSelection,
  serializeWorkspaceSnapshot,
  toDocumentState,
  validateEditorContent,
  validateEditorSeries,
  validateEditorTarget,
} from "./document";
import { formatUpdatedAt } from "./format";
import { buildPublishReadiness } from "./publish-readiness";
import type {
  EditorActivity,
  EditorDocumentState,
  EditorFeedback,
  EditorFileOption,
  EditorLocalAutosave,
  EditorStatus,
  RequestConfirmation,
  ShowFeedback,
} from "./types";

const FILE_VERSION_PATTERN = /^"sha256-[a-f0-9]{64}"$/;
// The server answers these when the file on disk is not the one the author
// started from.
const CONFLICT_STATUSES = [409, 412, 428];
const LOCAL_AUTOSAVE_DELAY_MS = 800;

// Owns the open document and its lifecycle: loading, saving, status
// transitions, deletion, save conflicts and the browser autosave.
//
// Three invariants hold the lifecycle together:
// - one request at a time (`activityRef`);
// - every write names the file version it started from (`baseVersionRef`);
// - a response is ignored if the document was replaced while it was in flight
//   (`documentEpochRef`).
export function useEditorWorkspace({
  showFeedback,
  requestConfirmation,
  onDocumentReplaced,
}: {
  showFeedback: ShowFeedback;
  requestConfirmation: RequestConfirmation;
  // Called with the new body length whenever the whole document is replaced.
  onDocumentReplaced: (bodyLength: number) => void;
}) {
  const [editorDocument, setEditorDocument] = useState(
    createEmptyEditorDocument
  );
  const [fileOptions, setFileOptions] = useState<EditorFileOption[]>([]);
  const [activePath, setActivePath] = useState<string | null>(null);
  const [selectedPath, setSelectedPath] = useState("");
  const [showPicker, setShowPicker] = useState(false);
  const [pickerFeedback, setPickerFeedback] = useState<EditorFeedback | null>(
    null
  );
  const [localAutosaveAt, setLocalAutosaveAt] = useState<number | null>(null);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const [baseVersion, setBaseVersion] = useState<string | null>(null);
  const [conflict, setConflict] = useState<SaveConflict | null>(null);
  const [activity, setActivity] = useState<EditorActivity | null>(null);
  const restoredDraftRef = useRef(false);
  const pendingAutosaveRef = useRef<EditorLocalAutosave | null>(null);
  const baseVersionRef = useRef<string | null>(null);
  const activityRef = useRef<EditorActivity | null>(null);
  const documentEpochRef = useRef(0);

  const rememberVersion = useCallback((version: string | null) => {
    baseVersionRef.current = version;
    setBaseVersion(version);
  }, []);
  const beginActivity = useCallback((next: EditorActivity) => {
    if (activityRef.current) return false;
    activityRef.current = next;
    setActivity(next);
    return true;
  }, []);
  const finishActivity = useCallback(() => {
    activityRef.current = null;
    setActivity(null);
  }, []);

  const workspaceSnapshot = useMemo(
    () => buildWorkspaceSnapshot(editorDocument, activePath),
    [editorDocument, activePath]
  );
  const workspaceFingerprint = useMemo(
    () => serializeWorkspaceSnapshot(workspaceSnapshot),
    [workspaceSnapshot]
  );
  const [persistedFingerprint, setPersistedFingerprint] =
    useState(workspaceFingerprint);
  const latestWorkspaceRef = useRef(workspaceSnapshot);
  const latestDirtyRef = useRef(false);
  useLayoutEffect(() => {
    latestWorkspaceRef.current = workspaceSnapshot;
    latestDirtyRef.current = workspaceFingerprint !== persistedFingerprint;
  }, [workspaceSnapshot, workspaceFingerprint, persistedFingerprint]);

  const { status, body } = editorDocument;
  const targetPath = workspaceSnapshot.targetPath;
  const isDirty = workspaceFingerprint !== persistedFingerprint;
  const isReadOnly =
    !initialLoadComplete ||
    status === "archived" ||
    activity === "load" ||
    activity === "delete" ||
    activity === "transition";
  const canOpenPreview = status !== "archived" && activePath === targetPath;
  const previewHref = `/${
    editorDocument.publishedAt ? editorDocument.publishedAt.slice(0, 4) : "2025"
  }/${editorDocument.id}`;
  const readingTimeEstimate = useMemo(
    () => estimateReadingTimeMinutes(body),
    [body]
  );
  const mdxContent = useMemo(
    () => buildMdxContent(editorDocument),
    [editorDocument]
  );
  const publishReadiness = useMemo(
    () =>
      buildPublishReadiness({
        title: editorDocument.title,
        description: editorDocument.description,
        series: editorDocument.series,
        seriesOrder: editorDocument.seriesOrder,
        publishedAt: editorDocument.publishedAt,
        id: editorDocument.id,
        tags: parseTagsInput(editorDocument.tagsInput),
        body: editorDocument.body,
        readingTimeEstimate,
        fileOptions,
      }),
    [editorDocument, readingTimeEstimate, fileOptions]
  );

  const updateField = useCallback(
    <Key extends keyof EditorDocumentState>(
      field: Key,
      value: EditorDocumentState[Key]
    ) => {
      setEditorDocument(current =>
        current[field] === value ? current : { ...current, [field]: value }
      );
    },
    []
  );

  const setBody = useCallback(
    (nextBody: string) => updateField("body", nextBody),
    [updateField]
  );

  const toggleTopic = useCallback((topicName: string) => {
    setEditorDocument(current => {
      const nextTopics = new Set(parseTagsInput(current.tagsInput));
      if (nextTopics.has(topicName)) {
        nextTopics.delete(topicName);
      } else {
        nextTopics.add(topicName);
      }

      return { ...current, tagsInput: serializeTopicSelection(nextTopics) };
    });
  }, []);

  const showPickerFeedback = useCallback<ShowFeedback>(
    (message, tone = "info") => {
      setPickerFeedback({ message, tone });
    },
    []
  );

  const applyWorkspaceState = useCallback(
    (
      nextState: EditorDocumentState,
      options: {
        activePath?: string | null;
        markPersisted?: boolean;
        diskVersion?: string | null;
      } = {}
    ) => {
      const nextActivePath = options.activePath ?? null;
      const nextDocument = toDocumentState(nextState);
      documentEpochRef.current += 1;
      rememberVersion(options.diskVersion ?? null);
      setConflict(null);

      setEditorDocument(nextDocument);
      onDocumentReplaced(nextDocument.body.length);
      setActivePath(nextActivePath);

      if (nextActivePath) {
        setSelectedPath(nextActivePath);
      }

      if (options.markPersisted) {
        setPersistedFingerprint(
          serializeWorkspaceSnapshot(
            buildWorkspaceSnapshot(nextDocument, nextActivePath)
          )
        );
      }
    },
    [onDocumentReplaced, rememberVersion]
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
      applyWorkspaceState(autosave, {
        activePath: autosave.activePath,
        diskVersion: autosave.baseVersion ?? null,
      });
      if (autosave.activePath && !autosave.baseVersion) {
        setConflict({
          path: autosave.activePath,
          message:
            "This recovered draft has no base version. Compare or keep a copy before replacing a saved file.",
        });
      }
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
    async (
      path: string,
      options: { successHint?: string; initial?: boolean } = {}
    ) => {
      if (activityRef.current) return false;
      if (!options.initial && latestDirtyRef.current) {
        const confirmed = await requestConfirmation({
          title: "Discard unsaved changes?",
          description:
            "Loading a file replaces your current input. Download or keep a copy first if you need it.",
          confirmLabel: "Discard and reload",
          tone: "danger",
        });
        if (!confirmed) return false;
      }
      if (!beginActivity("load")) return false;
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

        const version = data.version;
        if (
          typeof version !== "string" ||
          !FILE_VERSION_PATTERN.test(version)
        ) {
          throw new Error(
            "The file response has no valid version. Your current input was kept."
          );
        }
        applyWorkspaceState(parseEditorDocument(content, path), {
          activePath: path,
          markPersisted: true,
          diskVersion: version,
        });
        setShowPicker(false);
        setPickerFeedback(null);

        const restoredAutosave =
          options.initial && restoreLocalAutosave({ matchingPath: path });
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
      } finally {
        finishActivity();
      }
    },
    [
      beginActivity,
      finishActivity,
      requestConfirmation,
      applyWorkspaceState,
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
            initial: true,
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

  async function saveFile(
    options: { statusOverride?: EditorStatus; successHint?: string } = {}
  ) {
    if (activityRef.current || conflict) return false;
    const submitted = { ...latestWorkspaceRef.current };
    const nextStatus = options.statusOverride ?? submitted.status;
    const error =
      validateEditorTarget(submitted.publishedAt, submitted.id) ||
      validateEditorContent(submitted.title, submitted.description) ||
      validateEditorSeries(submitted.series, submitted.seriesOrder);
    if (error) {
      showFeedback(error, "error");
      return false;
    }
    const version = baseVersionRef.current;
    if (submitted.activePath && !version) {
      setConflict({
        path: submitted.activePath,
        message:
          "A saved file version is required. Compare your recovered draft before continuing.",
      });
      return false;
    }
    if (!beginActivity(options.statusOverride ? "transition" : "save")) {
      return false;
    }
    const epoch = documentEpochRef.current;
    const content = buildMdxContent({ ...submitted, status: nextStatus });
    try {
      const res = await fetch("/api/editor", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(submitted.activePath
            ? { "If-Match": version! }
            : { "If-None-Match": "*" }),
        },
        body: JSON.stringify({
          path: submitted.targetPath,
          previousPath: submitted.activePath,
          content,
        }),
      });
      if (!res.ok) {
        const message = await readResponseError(
          res,
          "Save failed. Your input is still in the editor."
        );
        if (CONFLICT_STATUSES.includes(res.status)) {
          setConflict({
            path: submitted.activePath ?? submitted.targetPath,
            message,
          });
        }
        throw new Error(message);
      }
      const saved = await res.json();
      if (
        typeof saved.version !== "string" ||
        !FILE_VERSION_PATTERN.test(saved.version)
      ) {
        throw new Error(
          "The save result is uncertain. Keep your draft and compare with disk before retrying."
        );
      }
      if (epoch !== documentEpochRef.current) return false;
      rememberVersion(saved.version);
      setActivePath(submitted.targetPath);
      setSelectedPath(submitted.targetPath);
      updateField("status", nextStatus);
      // Acknowledge only the submitted snapshot. Never reapply its text fields:
      // the author may have continued typing while the request was in flight.
      setPersistedFingerprint(
        serializeWorkspaceSnapshot(
          buildWorkspaceSnapshot(
            { ...submitted, status: nextStatus },
            submitted.targetPath
          )
        )
      );
      void refreshFileList();
      showFeedback(
        options.successHint ?? `Saved to ${submitted.targetPath}`,
        "success"
      );
      return true;
    } catch (reason) {
      showFeedback(
        reason instanceof Error
          ? reason.message
          : "Save failed. Your input is preserved.",
        "error"
      );
      return false;
    } finally {
      finishActivity();
    }
  }

  async function publishPost() {
    if (activityRef.current || conflict) return;
    const confirmed = await requestConfirmation({
      title: "Publish Post",
      description: `Mark "${editorDocument.title}" as published for the next deployment? It remains local until you commit and deploy.`,
      confirmLabel: "Publish",
      checks: publishReadiness,
    });

    if (!confirmed) {
      return;
    }

    await saveFile({
      statusOverride: "published",
      successHint: "Marked as published for the next deployment.",
    });
  }

  async function moveToDraft() {
    await saveFile({
      statusOverride: "draft",
      successHint: `Moved back to draft: ${targetPath}`,
    });
  }

  async function archivePost() {
    if (activityRef.current || conflict) return;
    const confirmed = await requestConfirmation({
      title: "Archive Post",
      description: `Archive "${editorDocument.title}"? Archived posts are removed from public view and can be restored later.`,
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
    if (activityRef.current) return;
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

    window.localStorage.removeItem(LOCAL_AUTOSAVE_KEY);
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
    if (activityRef.current || conflict) return;
    const submitted = { ...latestWorkspaceRef.current };
    if (!submitted.activePath) return;
    const version = baseVersionRef.current;
    if (!version) {
      setConflict({
        path: submitted.activePath,
        message: "Reload or compare the file before deleting it.",
      });
      return;
    }
    const confirmed = await requestConfirmation({
      title:
        submitted.status === "archived"
          ? "Delete Archived Post"
          : "Delete Draft",
      description: `Delete "${submitted.title}" permanently? Unsaved changes will also be discarded. Download a copy first if needed.`,
      confirmLabel: "Delete",
      tone: "danger",
    });
    if (!confirmed || !beginActivity("delete")) return;
    const epoch = documentEpochRef.current;
    try {
      const res = await fetch("/api/editor", {
        method: "DELETE",
        headers: { "Content-Type": "application/json", "If-Match": version },
        body: JSON.stringify({ path: submitted.activePath }),
      });
      if (!res.ok) {
        const message = await readResponseError(
          res,
          "Delete failed. Your input has been kept."
        );
        if (CONFLICT_STATUSES.includes(res.status)) {
          setConflict({ path: submitted.activePath, message });
        }
        throw new Error(message);
      }
      // Wait for the complete acknowledgement before another lifecycle action.
      await res.json();
      if (epoch !== documentEpochRef.current) return;
      const current = latestWorkspaceRef.current;
      const changed =
        serializeWorkspaceSnapshot(current) !==
        serializeWorkspaceSnapshot(submitted);
      applyWorkspaceState(
        changed ? { ...current, status: "draft" } : createEmptyEditorDocument(),
        {
          activePath: null,
          markPersisted: !changed,
        }
      );
      if (changed) setPersistedFingerprint("");
      pendingAutosaveRef.current = null;
      setLocalAutosaveAt(null);
      setSelectedPath("");
      showFeedback(
        changed
          ? "File deleted; newer input was kept as an unsaved draft."
          : `Deleted: ${submitted.activePath}`,
        "success"
      );
      void refreshFileList();
    } catch (reason) {
      showFeedback(
        reason instanceof Error
          ? reason.message
          : "Delete failed. Your draft is preserved.",
        "error"
      );
    } finally {
      finishActivity();
    }
  }

  function keepConflictAsDraft() {
    if (activityRef.current) return;
    const current = latestWorkspaceRef.current;
    const copyId = `${current.id.slice(0, 80).replace(/-+$/, "")}-copy-${crypto
      .randomUUID()
      .slice(0, 8)}`;
    applyWorkspaceState({
      ...current,
      id: copyId,
      status: "draft",
      series: "",
      seriesOrder: "",
    });
    setPersistedFingerprint("");
    showFeedback(
      "Your input is now a new unsaved draft. Save Draft writes a separate file.",
      "info"
    );
  }

  useEffect(() => {
    pendingAutosaveRef.current = parseLocalAutosave(
      window.localStorage.getItem(LOCAL_AUTOSAVE_KEY)
    );
    setLocalAutosaveAt(pendingAutosaveRef.current?.savedAt ?? null);
  }, []);

  useEffect(() => {
    if (!initialLoadComplete) return;
    const timer = window.setTimeout(() => {
      const autosave: EditorLocalAutosave = {
        version: LOCAL_AUTOSAVE_VERSION,
        savedAt: Date.now(),
        ...workspaceSnapshot,
        baseVersion,
      };
      try {
        window.localStorage.setItem(
          LOCAL_AUTOSAVE_KEY,
          JSON.stringify(autosave)
        );
        setLocalAutosaveAt(autosave.savedAt);
      } catch {
        showFeedback(
          "Browser autosave is unavailable. Keep this tab open or download your draft.",
          "error"
        );
      }
    }, LOCAL_AUTOSAVE_DELAY_MS);

    return () => window.clearTimeout(timer);
  }, [workspaceSnapshot, baseVersion, initialLoadComplete, showFeedback]);

  useEffect(() => {
    if (!isDirty) {
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

  return {
    editorDocument,
    updateField,
    setBody,
    toggleTopic,
    fileOptions,
    activePath,
    selectedPath,
    targetPath,
    showPicker,
    openPicker: () => setShowPicker(true),
    closePicker: () => setShowPicker(false),
    pickerFeedback,
    localAutosaveAt,
    initialLoadComplete,
    conflict,
    activity,
    isDirty,
    isReadOnly,
    canOpenPreview,
    previewHref,
    readingTimeEstimate,
    mdxContent,
    loadFromPath,
    saveFile,
    publishPost,
    moveToDraft,
    archivePost,
    startNewDraft,
    deleteCurrentPost,
    keepConflictAsDraft,
  };
}
