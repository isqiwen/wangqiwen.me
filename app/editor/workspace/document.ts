import {
  getPostFilePath,
  isIsoDate,
  isPostSlug,
  isPostStatus,
} from "@/utils/shared/post-fields";
import {
  formatExportedMetadata,
  parseExportedMetadata,
  stripExportedMetadata,
} from "@/utils/shared/post-metadata";
import { isKnownSeries } from "@/utils/series";
import { TOPIC_DEFINITIONS } from "@/utils/topics";
import type {
  EditorDocumentState,
  EditorLocalAutosave,
  EditorStatus,
  EditorWorkspaceSnapshot,
} from "./types";

export const EMPTY_DOCUMENT_BODY = "Start writing here.\n";

export const LOCAL_AUTOSAVE_KEY = "mdx-editor.local-autosave.v2";

export const LOCAL_AUTOSAVE_VERSION = 2;

function today() {
  return new Date().toISOString().slice(0, 10);
}

function buildTargetPath(publishedAt: string, id: string) {
  const year = publishedAt ? publishedAt.slice(0, 4) : "2025";
  return getPostFilePath(year, id);
}

export function validateEditorTarget(publishedAt: string, id: string) {
  if (!isPostSlug(id)) {
    return "Post ID must use 1-100 lowercase letters, numbers, and single hyphens.";
  }

  if (!isIsoDate(publishedAt)) {
    return "Published date must be a valid date in YYYY-MM-DD format.";
  }

  return null;
}

export function validateEditorContent(title: string, description: string) {
  if (!title.trim()) {
    return "Title is required.";
  }

  if (!description.trim()) {
    return "Description is required.";
  }

  return null;
}

export function validateEditorSeries(series: string, seriesOrder: string) {
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

export function createEmptyEditorDocument(): EditorDocumentState {
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
    body: EMPTY_DOCUMENT_BODY,
  };
}

export function parseTagsInput(value: string): string[] {
  return Array.from(
    new Set(
      value
        .split(",")
        .map(item => item.trim())
        .filter(Boolean)
    )
  );
}

export function serializeTopicSelection(selectedTopics: Set<string>): string {
  return TOPIC_DEFINITIONS.filter(topic => selectedTopics.has(topic.name))
    .map(topic => topic.name)
    .join(", ");
}

// Copies exactly the document fields, in a fixed order. Snapshots are compared
// as serialized text, so every snapshot must list its keys the same way no
// matter which object the fields came from.
export function toDocumentState(
  state: EditorDocumentState
): EditorDocumentState {
  return {
    title: state.title,
    description: state.description,
    summary: state.summary,
    series: state.series,
    seriesOrder: state.seriesOrder,
    publishedAt: state.publishedAt,
    updatedAt: state.updatedAt,
    id: state.id,
    status: state.status,
    tagsInput: state.tagsInput,
    body: state.body,
  };
}

export function buildWorkspaceSnapshot(
  state: EditorDocumentState,
  activePath: string | null
): EditorWorkspaceSnapshot {
  return {
    activePath,
    ...toDocumentState(state),
    targetPath: buildTargetPath(state.publishedAt, state.id),
  };
}

export function serializeWorkspaceSnapshot(snapshot: EditorWorkspaceSnapshot) {
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
  return isPostStatus(value) ? value : "draft";
}

export function parseEditorDocument(
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

export function parseLocalAutosave(
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
      baseVersion:
        typeof parsed.baseVersion === "string" &&
        /^"sha256-[a-f0-9]{64}"$/.test(parsed.baseVersion)
          ? parsed.baseVersion
          : null,
    };
  } catch {
    return null;
  }
}

export function buildMdxContent(state: EditorDocumentState) {
  return `${formatExportedMetadata(
    buildMetadataObject(state)
  )}${state.body.trim()}\n`;
}

function buildMetadataObject(state: EditorDocumentState) {
  const metadata: Record<string, unknown> = {
    title: state.title,
    description: state.description,
    publishedAt: state.publishedAt,
    id: state.id,
    status: state.status,
    tags: parseTagsInput(state.tagsInput),
  };

  if (state.summary.trim()) {
    metadata.summary = state.summary.trim();
  }

  if (state.series.trim()) {
    metadata.series = state.series.trim();
    metadata.seriesOrder = Number(state.seriesOrder);
  }

  if (state.updatedAt.trim()) {
    metadata.updatedAt = state.updatedAt.trim();
  }

  return metadata;
}
