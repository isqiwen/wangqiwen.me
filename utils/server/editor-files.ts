import { promises as fs, type Dirent } from "node:fs";
import path from "node:path";
import { parseExportedMetadata } from "@/utils/shared/post-metadata";

export type EditorFileEntry = {
  path: string;
  label: string;
  status: "draft" | "published" | "archived";
  updatedAt: number;
};

// A live listing is not a filesystem transaction. Ignore entries that disappear
// during a save/move/delete, but never hide permission or other I/O failures.
function isMissing(error: unknown): boolean {
  return (error as NodeJS.ErrnoException | null)?.code === "ENOENT";
}

function isArticleEntry(entry: Dirent, depth: number): boolean {
  if (depth === 0) return entry.isDirectory() && /^\d{4}$/.test(entry.name);
  if (depth === 1) {
    return entry.isDirectory() && entry.name.length <= 100 &&
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(entry.name);
  }
  return depth === 2 && entry.isFile() && entry.name === "article.mdx";
}

export async function collectEditorFiles(root = process.cwd()): Promise<EditorFileEntry[]> {
  const result: EditorFileEntry[] = [];
  await walk(path.join(root, "app", "(post)"), 0, root, result);
  return result;
}

async function walk(dir: string, depth: number, root: string, bucket: EditorFileEntry[]) {
  let entries: Dirent[];
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch (error) {
    if (isMissing(error)) return;
    throw error;
  }

  const enriched = await Promise.all(
    // Filter BEFORE stat: the atomic writer's dot-prefixed temporary files can
    // disappear immediately and are never part of the article listing.
    entries.filter(entry => isArticleEntry(entry, depth)).map(async entry => {
      const abs = path.join(dir, entry.name);
      try {
        const stats = await fs.stat(abs);
        return { entry, abs, mtime: stats.mtimeMs };
      } catch (error) {
        if (isMissing(error)) return null;
        throw error;
      }
    })
  );
  const available = enriched.filter((item): item is NonNullable<typeof item> => item !== null);
  available.sort((a, b) => depth === 0
    ? Number(b.entry.name) - Number(a.entry.name)
    : b.mtime - a.mtime
  );

  for (const { entry, abs, mtime } of available) {
    if (entry.isDirectory()) {
      await walk(abs, depth + 1, root, bucket);
      continue;
    }

    let content: string;
    try {
      content = await fs.readFile(abs, "utf8");
    } catch (error) {
      if (isMissing(error)) continue;
      throw error;
    }
    const metadata = parseExportedMetadata<{ status?: unknown }>(content);
    const status = metadata?.status;
    const relativePath = path.relative(root, abs).replace(/\\/g, "/");
    bucket.push({
      path: relativePath,
      label: relativePath.replace(/^app\/\(post\)\//, "").replace(/\/article\.mdx$/, ""),
      status: status === "draft" || status === "published" || status === "archived" ? status : "archived",
      updatedAt: mtime,
    });
  }
}
