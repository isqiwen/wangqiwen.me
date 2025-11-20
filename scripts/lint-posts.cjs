#!/usr/bin/env node

const {
  SUPPORTED_LOCALES,
  collectPosts,
} = require("./lib/posts");

async function main() {
  const entries = await collectPosts();
  const errors = [];
  const seenIds = new Map();

  for (const [key, entry] of entries) {
    const ids = new Set();
    const publishedAtValues = new Set();

    for (const locale of SUPPORTED_LOCALES) {
      const data = entry.locales[locale];
      if (!data) continue;

      const { metadata, frontmatter } = data;
      const id = metadata.id || frontmatter.id;
      const publishedAt = metadata.publishedAt || frontmatter.publishedAt;
      const title = metadata.title || frontmatter.title;

      if (!title) {
        errors.push(`${locale}:${key} 缺少 title`);
      }
      if (!id) {
        errors.push(`${locale}:${key} 缺少 id`);
      } else {
        ids.add(id);
      }
      if (!publishedAt) {
        errors.push(`${locale}:${key} 缺少 publishedAt`);
      } else {
        publishedAtValues.add(publishedAt);
      }
    }

    if (ids.size > 1) {
      errors.push(`${key} 多语言使用了不同的 id: ${Array.from(ids).join(", ")}`);
    }

    const [firstId] = ids;
    if (firstId) {
      if (seenIds.has(firstId) && seenIds.get(firstId) !== key) {
        errors.push(`id "${firstId}" 重复（${seenIds.get(firstId)} 与 ${key}）`);
      } else {
        seenIds.set(firstId, key);
      }
    }

    if (publishedAtValues.size > 1) {
      errors.push(`${key} 多语言 publishedAt 不一致: ${Array.from(publishedAtValues).join(", ")}`);
    }
  }

  if (errors.length > 0) {
    console.error("文章元数据校验失败:\n" + errors.map(msg => ` - ${msg}`).join("\n"));
    process.exitCode = 1;
    return;
  }

  console.log("所有文章元数据校验通过。");
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
