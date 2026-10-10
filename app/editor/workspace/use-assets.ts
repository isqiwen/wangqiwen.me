import { useCallback, useEffect, useMemo, useState } from "react";
import { toAssetFolderId } from "@/utils/shared/post-fields";
import type { ComponentSnippetInsert } from "../snippets";
import { readResponseError, resolveApiError } from "./api";
import {
  buildImageSnippet,
  removeAssetReferencesFromBody,
  stripExtension,
} from "./mdx-formatting";
import type { EditorAsset, RequestConfirmation, ShowFeedback } from "./types";

const READ_ONLY_MESSAGE =
  "Archived posts are read-only. Restore to draft before editing.";

// Images live in /public/images/<post id>. Uploading and deleting act on the
// disk immediately; references in the body change only in the editor.
export function useAssets({
  postId,
  body,
  setBody,
  isReadOnly,
  insertSnippet,
  clampCursor,
  showFeedback,
  requestConfirmation,
}: {
  postId: string;
  body: string;
  setBody: (body: string) => void;
  isReadOnly: boolean;
  insertSnippet: (snippet: string | ComponentSnippetInsert) => void;
  clampCursor: (maximum: number) => void;
  showFeedback: ShowFeedback;
  requestConfirmation: RequestConfirmation;
}) {
  const folderId = useMemo(() => toAssetFolderId(postId), [postId]);
  const [assets, setAssets] = useState<EditorAsset[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [deletingPath, setDeletingPath] = useState<string | null>(null);

  const refresh = useCallback(
    async (options: { silent?: boolean } = {}) => {
      setIsLoading(true);

      try {
        const res = await fetch(
          `/api/editor/assets?id=${encodeURIComponent(folderId)}`,
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
        setIsLoading(false);
      }
    },
    [folderId, showFeedback]
  );

  useEffect(() => {
    void refresh({ silent: true });
  }, [refresh]);

  async function uploadImage(file: File) {
    if (isReadOnly) {
      showFeedback(READ_ONLY_MESSAGE, "error");
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
      formData.append("id", postId);
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

      insertSnippet(
        buildImageSnippet({
          src: data.path as string,
          width: data.width as number | null | undefined,
          height: data.height as number | null | undefined,
          alt: stripExtension(file.name),
        })
      );
      await refresh({ silent: true });
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

  async function copyPath(assetPath: string) {
    try {
      await navigator.clipboard.writeText(assetPath);
      showFeedback(`Copied asset path: ${assetPath}`, "info");
    } catch {
      showFeedback("Failed to copy asset path.", "error");
    }
  }

  function insert(asset: EditorAsset) {
    if (isReadOnly) {
      showFeedback(READ_ONLY_MESSAGE, "error");
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

  async function remove(asset: EditorAsset) {
    if (isReadOnly) {
      showFeedback(READ_ONLY_MESSAGE, "error");
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
      setDeletingPath(asset.path);
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
        clampCursor(references.body.length);
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
      setDeletingPath(null);
    }
  }

  return {
    folderId,
    assets,
    isLoading,
    isUploading,
    deletingPath,
    refresh,
    uploadImage,
    copyPath,
    insert,
    remove,
  };
}
