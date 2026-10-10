import NextImage from "next/image";
import { useRef } from "react";
import { formatFileSize, formatUpdatedAt } from "./format";
import type { EditorAsset } from "./types";

type AssetsPanelProps = {
  folderId: string;
  assets: EditorAsset[];
  isLoading: boolean;
  isUploading: boolean;
  deletingPath: string | null;
  isReadOnly: boolean;
  onUpload: (file: File) => void;
  onRefresh: () => void;
  onInsert: (asset: EditorAsset) => void;
  onCopyPath: (assetPath: string) => void;
  onDelete: (asset: EditorAsset) => void;
};

export function AssetsPanel({
  folderId,
  assets,
  isLoading,
  isUploading,
  deletingPath,
  isReadOnly,
  onUpload,
  onRefresh,
  onInsert,
  onCopyPath,
  onDelete,
}: AssetsPanelProps) {
  const assetInputRef = useRef<HTMLInputElement | null>(null);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-700">Image Assets</h2>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            Assets are grouped by post ID in{" "}
            <code>/public/images/{folderId}</code>. Existing files stay in their
            current folder if you later rename the post ID.
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
                onUpload(file);
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
            onClick={onRefresh}
            disabled={isLoading}
            className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-50 disabled:text-slate-400"
          >
            {isLoading ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-500">
        <span>Folder: /images/{folderId}</span>
        <span>
          {assets.length} asset{assets.length === 1 ? "" : "s"}
        </span>
      </div>

      {assets.length === 0 ? (
        <div className="mt-4 rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-sm text-slate-500">
          No uploaded images yet. Upload here, drag an image into the editor, or
          paste one from the clipboard.
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
                  onClick={() => onInsert(asset)}
                  disabled={isReadOnly}
                  className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-white disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-white/60 disabled:text-slate-400"
                >
                  Insert
                </button>
                <button
                  type="button"
                  onClick={() => onCopyPath(asset.path)}
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
                  onClick={() => onDelete(asset)}
                  disabled={isReadOnly || deletingPath === asset.path}
                  className="rounded-full border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-50 disabled:cursor-not-allowed disabled:border-rose-100 disabled:bg-white/60 disabled:text-rose-300"
                >
                  {deletingPath === asset.path ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
