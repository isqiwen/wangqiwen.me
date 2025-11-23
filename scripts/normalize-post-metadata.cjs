#!/usr/bin/env node

const { readFile, writeFile } = require("fs/promises");
const {
  SUPPORTED_LOCALES,
  POSTS_MANIFEST_PATH,
  collectPosts,
  getFirstValue,
  buildNormalizedMetadata,
  replaceMetadataBlock,
  writeManifest,
} = require("./lib/posts");

async function main() {
  const args = process.argv.slice(2);
  const isSilent = args.includes("--silent");
  const isCheck = args.includes("--check");
  const changedFiles = new Set();

  const entries = await collectPosts();
  const manifest = {
    locales: SUPPORTED_LOCALES,
    posts: Object.fromEntries(SUPPORTED_LOCALES.map(locale => [locale, []])),
    translations: {},
  };

  for (const entry of entries.values()) {
    const canonicalId =
      getFirstValue(entry.locales, data => data.metadata.id || data.frontmatter.id) ||
      entry.id;
    const canonicalPublishedAt =
      getFirstValue(entry.locales, data => data.metadata.publishedAt || data.frontmatter.publishedAt) ||
      `${entry.year}-01-01`;

    for (const locale of SUPPORTED_LOCALES) {
      const data = entry.locales[locale];
      if (!data) continue;

      const normalized = buildNormalizedMetadata(data, {
        postId: canonicalId,
        publishedAt: canonicalPublishedAt,
        id: entry.id,
      });

      const newSource = replaceMetadataBlock(data.source, normalized);
      if (newSource && newSource !== data.source) {
        if (isCheck) {
          changedFiles.add(data.path);
        } else {
          await writeFile(data.path, newSource, "utf8");
        }
      }

      manifest.posts[locale].push({
        id: normalized.id,
        title: normalized.title,
        description: normalized.description ?? "",
        publishedAt: normalized.publishedAt,
        path: `/${locale}/${entry.year}/${entry.id}`,
      });

      if (!manifest.translations[normalized.id]) {
        manifest.translations[normalized.id] = {};
      }
      manifest.translations[normalized.id][locale] = `/${locale}/${entry.year}/${entry.id}`;
    }
  }

  // 按发布时间倒序排序，确保 manifest 列表从新到旧
  for (const locale of SUPPORTED_LOCALES) {
    manifest.posts[locale].sort((a, b) => {
      if (a.publishedAt === b.publishedAt) return 0;
      return a.publishedAt > b.publishedAt ? -1 : 1;
    });
  }

  const manifestJSON = JSON.stringify(manifest, null, 2);

  if (isCheck) {
    let existing = "";
    try {
      existing = await readFile(POSTS_MANIFEST_PATH, "utf8");
    } catch {
      // missing manifest counts as change
    }

    if (existing !== manifestJSON) {
      changedFiles.add(POSTS_MANIFEST_PATH);
    }
  } else {
    await writeManifest(manifest);
  }

  if (isCheck) {
    if (changedFiles.size > 0) {
      console.error(
        "Posts metadata or manifest need to be synchronized:\n" +
          [...changedFiles].map(file => ` - ${file}`).join("\n"),
      );
      process.exitCode = 1;
    } else if (!isSilent) {
      console.log("Posts metadata are up to date.");
    }
    return;
  }

  if (!isSilent) {
    console.log("Post metadata normalized and manifest updated.");
  }
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
