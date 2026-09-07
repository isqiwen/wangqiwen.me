"use client";

import { useState } from "react";

export type SaveConflict = { path: string; message: string };

export function SaveConflictPanel({ conflict, content, busy, onReload, onCopy }: {
  conflict: SaveConflict;
  content: string;
  busy: boolean;
  onReload: () => void;
  onCopy: () => void;
}) {
  const [latest, setLatest] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function compare() {
    setLoading(true);
    setError("");
    setLatest(null);
    try {
      const response = await fetch(`/api/editor?path=${encodeURIComponent(conflict.path)}`, { cache: "no-store" });
      if (!response.ok) throw new Error(response.status === 404
        ? "The file no longer exists at this path. Your draft can be downloaded or saved as a new file."
        : `Could not read the latest file (HTTP ${response.status}).`);
      const data = await response.json();
      if (typeof data.content !== "string") throw new Error("The latest file response was invalid.");
      // Comparing never advances the editor's base version or replaces input.
      setLatest(data.content);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not load the latest file.");
    } finally {
      setLoading(false);
    }
  }

  function download() {
    const url = URL.createObjectURL(new Blob([content], { type: "text/markdown;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${conflict.path.split("/").at(-2) || "article"}-local.mdx`;
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1_000);
  }

  return (
    <section role="alert" aria-label="Save conflict" className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-slate-900">
      <h2 className="font-semibold">Resolve the file conflict</h2>
      <p className="mt-1 text-sm">{conflict.message}</p>
      <p className="mt-1 text-sm">Your current input is preserved. Comparing does not authorize an overwrite.</p>
      <div className="my-3 flex flex-wrap gap-3 text-sm">
        <button type="button" onClick={() => void compare()} disabled={loading || busy}>Compare with latest</button>
        <button type="button" onClick={download}>Download my draft</button>
        <button type="button" onClick={onCopy} disabled={busy}>Keep as new draft</button>
        <button type="button" onClick={onReload} disabled={busy}>Reload latest</button>
      </div>
      {loading ? <p role="status">Reading latest file…</p> : null}
      {error ? <p>{error}</p> : null}
      {latest !== null ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <div><h3>My current draft</h3><pre data-testid="conflict-local" className="max-h-80 overflow-auto whitespace-pre-wrap text-xs">{content}</pre></div>
          <div><h3>Latest file on disk</h3><pre data-testid="conflict-latest" className="max-h-80 overflow-auto whitespace-pre-wrap text-xs">{latest}</pre></div>
        </div>
      ) : null}
    </section>
  );
}
