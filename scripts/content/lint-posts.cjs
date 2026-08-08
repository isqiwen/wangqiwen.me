#!/usr/bin/env node

const {
  collectPosts,
  normalizePositiveInteger,
  normalizeTags,
} = require("./lib/posts");
const { TOPICS, getUnknownTopics } = require("./lib/topics");
const { SERIES, isKnownSeries } = require("./lib/series");
const { validateContentQuality } = require("./lib/content-quality");

async function main() {
  const entries = await collectPosts();
  const errors = [];
  const seenIds = new Map();
  const seriesPositions = new Map();
  const articlePaths = new Set(
    Array.from(entries.values())
      .filter(entry => entry.metadata.status === "published")
      .map(entry => `/${entry.year}/${entry.id}`)
  );

  for (const [key, entry] of entries) {
    const [pathYear, pathId] = key.split("/");
    const { metadata } = entry;
    const title = metadata.title;
    const id = metadata.id;
    const publishedAt = metadata.publishedAt;
    const description = metadata.description || "";
    const summary = metadata.summary || "";
    const series = metadata.series || "";
    const seriesOrder = metadata.seriesOrder;
    const updatedAt = metadata.updatedAt || "";
    const statusValue = metadata.status;
    const rawTags = metadata.tags;
    const tags = normalizeTags(rawTags);
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

    for (const retiredField of ["draft", "archived", "excerpt"]) {
      if (Object.hasOwn(metadata, retiredField)) {
        errors.push(
          `${key} uses retired metadata field "${retiredField}"; use status and description instead`
        );
      }
    }

    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(pathId)) {
      errors.push(`${key} has an invalid directory slug`);
    }

    if (
      typeof statusValue !== "string" ||
      !["draft", "published", "archived"].includes(statusValue)
    ) {
      errors.push(
        `${key} has an invalid or missing status value; use draft, published, or archived`
      );
    }

    if (typeof description !== "string" || !description.trim()) {
      errors.push(`${key} is missing description`);
    }

    if (summary && typeof summary !== "string") {
      errors.push(`${key} has an invalid summary value`);
    }

    if (series && typeof series !== "string") {
      errors.push(`${key} has an invalid series value`);
    }

    if (series && typeof series === "string" && !isKnownSeries(series)) {
      errors.push(
        `${key} has undefined series: ${series}. ` +
          `Choose from: ${SERIES.map(item => item.slug).join(", ")}`
      );
    }

    const normalizedSeriesOrder = normalizePositiveInteger(seriesOrder);
    if (series && normalizedSeriesOrder === 0) {
      errors.push(
        `${key} seriesOrder must be a positive integer when series is set`
      );
    }

    if (!series && seriesOrder != null && seriesOrder !== "") {
      errors.push(`${key} seriesOrder requires a series`);
    }

    if (series && normalizedSeriesOrder > 0 && statusValue !== "archived") {
      const seriesPosition = `${series}:${normalizedSeriesOrder}`;
      const existing = seriesPositions.get(seriesPosition);
      if (existing) {
        errors.push(
          `${key} duplicates series position ${normalizedSeriesOrder} in ${series}; already used by ${existing}`
        );
      } else {
        seriesPositions.set(seriesPosition, key);
      }
    }

    if (
      updatedAt &&
      (typeof updatedAt !== "string" ||
        Number.isNaN(new Date(updatedAt).getTime()))
    ) {
      errors.push(`${key} has an invalid updatedAt value`);
    }

    if (
      rawTags != null &&
      (!Array.isArray(rawTags) || rawTags.some(tag => typeof tag !== "string"))
    ) {
      errors.push(`${key} tags must be an array of strings`);
    }

    const hasNonEmptyRawTags = Array.isArray(rawTags) && rawTags.length > 0;

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
