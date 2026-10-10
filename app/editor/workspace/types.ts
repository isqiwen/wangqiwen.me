import type { PostStatus } from "@/utils/shared/post-fields";

export type EditorFileOption = {
  path: string;
  label: string;
  status: EditorStatus;
  updatedAt: number;
};

export type EditorStatus = PostStatus;

export type EditorAsset = {
  name: string;
  path: string;
  size: number;
  updatedAt: number;
  width?: number | null;
  height?: number | null;
};

export type FeedbackTone = "success" | "error" | "info";

export type EditorFeedback = {
  message: string;
  tone: FeedbackTone;
};

export type EditorConfirmation = {
  title: string;
  description: string;
  confirmLabel: string;
  tone?: "default" | "danger";
  checks?: PublishReadinessCheck[];
};

export type PublishReadinessStatus = "pass" | "warning" | "fail";

export type PublishReadinessCheck = {
  label: string;
  detail: string;
  status: PublishReadinessStatus;
};

export type EditorOutlineHeading = {
  level: 2 | 3 | 4;
  line: number;
  position: number;
  text: string;
};

export type MdxFormattingAction =
  | "bold"
  | "link"
  | "inlineCode"
  | "codeBlock"
  | "quote"
  | "bulletList"
  | "orderedList"
  | "heading";

export type EditorChangeSet = {
  available: boolean;
  diff: string;
};

export type EditorChanges = {
  saved: EditorChangeSet;
  git: EditorChangeSet;
};

export type ChangesView = "saved" | "git";

export type EditorDocumentState = {
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

export type EditorWorkspaceSnapshot = EditorDocumentState & {
  activePath: string | null;
  targetPath: string;
};

export type EditorLocalAutosave = EditorWorkspaceSnapshot & {
  version: 2;
  savedAt: number;
  baseVersion?: string | null;
};

// The one lifecycle request that may be in flight at a time.
export type EditorActivity = "save" | "transition" | "delete" | "load";

export type ShowFeedback = (message: string, tone?: FeedbackTone) => void;

export type RequestConfirmation = (
  confirmation: EditorConfirmation
) => Promise<boolean>;
