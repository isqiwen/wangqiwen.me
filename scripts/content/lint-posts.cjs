#!/usr/bin/env node

const {
  collectPosts,
  normalizePositiveInteger,
  normalizeStatus,
  normalizeTags,
} = require("./lib/posts");
const { TOPICS, getUnknownTopics } = require("./lib/topics");
const { validateContentQuality } = require("./lib/content-quality");

async function main() {
  const entries = await collectPosts();
  const errors = [];
  const seenIds = new Map();
  const articlePaths = new Set(
    Array.from(entries.values())
      .filter(entry => {
        const { metadata, frontmatter } = entry;
        return (
          normalizeStatus(
            metadata.status ?? frontmatter.status,
            metadata.draft ?? frontmatter.draft,
            metadata.archived ?? frontmatter.archived
          ) === "published"
        );
      })
      .map(entry => `/${entry.year}/${entry.id}`)
  );

  for (const [key, entry] of entries) {
    const [pathYear, pathId] = key.split("/");
    const { metadata, frontmatter } = entry;
    const title = metadata.title || frontmatter.title;
    const id = metadata.id || frontmatter.id;
    const publishedAt = metadata.publishedAt || frontmatter.publishedAt;
    const description =
      metadata.description ||
      metadata.summary ||
      metadata.excerpt ||
      frontmatter.description ||
      frontmatter.summary ||
      frontmatter.excerpt ||
      "";
    const summary = metadata.summary || frontmatter.summary || "";
    const series = metadata.series || frontmatter.series || "";
    const updatedAt = metadata.updatedAt || frontmatter.updatedAt || "";
    const statusValue = metadata.status ?? frontmatter.status;
    const rawTags = metadata.tags ?? frontmatter.tags;
    const tags = normalizeTags(rawTags);
    const featuredRaw = metadata.featured ?? frontmatter.featured;
    const readingTimeMinutes = metadata.readingTimeMinutes;

    if (typeof title !== "string" || !title.trim()) {
      errors.push(`${key} is missing title`);
    }

    if (!id) {
      errors.push(`${key} is missing id`);
    }

    if (!publishedAt) {
      errors.push(`${key} is missing publishedAt`);
    } else if (
      typeof publishedAt !== "string" ||
      !/^\d{4}-\d{2}-\d{2}$/.test(publishedAt) ||
      !isIsoDate(publishedAt)
    ) {
      errors.push(`${key} has an invalid publishedAt value; use YYYY-MM-DD`);
    } else if (publishedAt.slice(0, 4) !== pathYear) {
      errors.push(`${key} publishedAt year does not match its directory`);
    }

    if (id && id !== pathId) {
      errors.push(`${key} metadata id must match its directory`);
    }

    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(pathId)) {
      errors.push(`${key} has an invalid directory slug`);
    }

    if (
      statusValue != null &&
      (typeof statusValue !== "string" ||
        !["draft", "published", "archived"].includes(
          statusValue.trim().toLowerCase()
        ))
    ) {
      errors.push(`${key} has an invalid status value`);
    }

    if (typeof description !== "string" || !description.trim()) {
      errors.push(`${key} is missing description or summary`);
    }

    if (summary && typeof summary !== "string") {
      errors.push(`${key} has an invalid summary value`);
    }

    if (series && typeof series !== "string") {
      errors.push(`${key} has an invalid series value`);
    }

    if (
      updatedAt &&
      (typeof updatedAt !== "string" ||
        Number.isNaN(new Date(updatedAt).getTime()))
    ) {
      errors.push(`${key} has an invalid updatedAt value`);
    }

    if (
      featuredRaw != null &&
      !["boolean", "string"].includes(typeof featuredRaw)
    ) {
      errors.push(`${key} has an invalid featured value`);
    }

    const hasNonEmptyRawTags =
      (Array.isArray(rawTags) && rawTags.length > 0) ||
      (typeof rawTags === "string" && rawTags.trim().length > 0);

    if (hasNonEmptyRawTags && tags.length === 0) {
      errors.push(`${key} has tags but none could be parsed`);
    }

    const unknownTopics = getUnknownTopics(tags);
    if (unknownTopics.length > 0) {
      errors.push(
        `${key} has undefined topics: ${unknownTopics.join(", ")}. ` +
          `Choose from: ${TOPICS.map(topic => topic.name).join(", ")}`
      );
    }

    if (
      readingTimeMinutes != null &&
      normalizePositiveInteger(readingTimeMinutes) === 0
    ) {
      errors.push(`${key} has an invalid readingTimeMinutes value`);
    }

    if (id) {
      if (seenIds.has(id) && seenIds.get(id) !== key) {
        errors.push(
          `id "${id}" is duplicated by ${seenIds.get(id)} and ${key}`
        );
      } else {
        seenIds.set(id, key);
      }
    }

    for (const issue of validateContentQuality(entry.source, {
      articlePaths,
    })) {
      errors.push(`${key} ${issue}`);
    }
  }

  if (errors.length > 0) {
    console.error(
      "Post metadata validation failed.\n" +
        errors.map(msg => ` - ${msg}`).join("\n")
    );
    process.exitCode = 1;
    return;
  }

  console.log("All post metadata and content quality checks passed.");
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});

function isIsoDate(value) {
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return (
    !Number.isNaN(parsed.getTime()) &&
    parsed.toISOString().slice(0, 10) === value
  );
}
