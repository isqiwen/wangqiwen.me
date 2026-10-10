import { useMemo } from "react";
import { SERIES_DEFINITIONS } from "@/utils/series";
import { TOPIC_DEFINITIONS } from "@/utils/topics";
import { parseTagsInput } from "./document";
import { Field } from "./field";
import { formatUpdatedAt } from "./format";
import type { EditorDocumentState } from "./types";

type MetadataFormProps = {
  value: EditorDocumentState;
  onChange: <Key extends keyof EditorDocumentState>(
    field: Key,
    value: EditorDocumentState[Key]
  ) => void;
  onToggleTopic: (topicName: string) => void;
  isReadOnly: boolean;
  targetPath: string;
  readingTimeEstimate: number;
  isSaving: boolean;
  isDirty: boolean;
  localAutosaveAt: number | null;
  canOpenPreview: boolean;
};

export function MetadataForm({
  value,
  onChange,
  onToggleTopic,
  isReadOnly,
  targetPath,
  readingTimeEstimate,
  isSaving,
  isDirty,
  localAutosaveAt,
  canOpenPreview,
}: MetadataFormProps) {
  const {
    title,
    id,
    publishedAt,
    updatedAt,
    series,
    seriesOrder,
    description,
    summary,
    status: currentStatus,
  } = value;
  const selectedTopics = useMemo(
    () => new Set(parseTagsInput(value.tagsInput)),
    [value.tagsInput]
  );

  return (
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
            onChange={event => onChange("title", event.target.value)}
            placeholder="A clear article title"
            className="rounded-md border border-slate-200 px-3 py-2 text-sm"
            disabled={isReadOnly}
          />
        </Field>
        <Field label="ID" htmlFor="editor-id">
          <input
            id="editor-id"
            value={id}
            onChange={event => onChange("id", event.target.value)}
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
        <Field label="Published At (YYYY-MM-DD)" htmlFor="editor-published-at">
          <input
            id="editor-published-at"
            type="date"
            value={publishedAt}
            onChange={event => onChange("publishedAt", event.target.value)}
            className="rounded-md border border-slate-200 px-3 py-2 text-sm"
            disabled={isReadOnly}
          />
        </Field>
        <Field label="Updated At (optional)" htmlFor="editor-updated-at">
          <input
            id="editor-updated-at"
            type="date"
            value={updatedAt}
            onChange={event => onChange("updatedAt", event.target.value)}
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
              onChange("series", event.target.value);
              if (!event.target.value) {
                onChange("seriesOrder", "");
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
              onChange={event => onChange("seriesOrder", event.target.value)}
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
                    onChange={() => onToggleTopic(topic.name)}
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
            onChange={event => onChange("description", event.target.value)}
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
            onChange={event => onChange("summary", event.target.value)}
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
        <span role="status" data-testid="editor-save-status">
          {isSaving
            ? "Saving…"
            : isDirty
            ? "Unsaved changes"
            : "All changes saved to disk"}
        </span>
        {localAutosaveAt ? (
          <span>Local autosave: {formatUpdatedAt(localAutosaveAt)}</span>
        ) : null}
        {currentStatus !== "archived" && !canOpenPreview ? (
          <span>Save the current path once to enable preview.</span>
        ) : null}
      </div>
    </section>
  );
}
