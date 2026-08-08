#!/usr/bin/env node

const { readFile, writeFile } = require("fs/promises");
const {
  POSTS_MANIFEST_PATH,
  collectPosts,
  buildNormalizedMetadata,
  replaceMetadataBlock,
  writeManifest,
} = require("./lib/posts");
const {
  createPostRegistrySource,
} = require("../../utils/shared/post-registry");
const { TOPICS, getUnknownTopics } = require("./lib/topics");
const { isKnownSeries, SERIES } = require("./lib/series");
const { readFile: readFileFromDisk } = require("fs/promises");
const { join } = require("path");

const POSTS_REGISTRY_PATH = join(
  process.cwd(),
  "app",
  "(post)",
  "post-registry.ts"
);

async function main() {
  const args = process.argv.slice(2);
  const isSilent = args.includes("--silent");
  const isCheck = args.includes("--check");
  const publishedOnly = args.includes("--published-only");
  const changedFiles = new Set();

  const entries = await collectPosts();
  const manifest = {
    posts: [],
  };
  const registryPosts = [];
  const seriesPositions = new Map();

  for (const entry of entries.values()) {
    const normalized = buildNormalizedMetadata(entry, {
      postId: entry.metadata.id,
      publishedAt: entry.metadata.publishedAt,
    });
    const unknownTopics = getUnknownTopics(normalized.tags ?? []);
    if (unknownTopics.length > 0) {
      throw new Error(
        `${entry.path} has undefined topics: ${unknownTopics.join(", ")}. ` +
          `Choose from: ${TOPICS.map(topic => topic.name).join(", ")}`
      );
    }
    validateSeriesMetadata(entry, normalized);
    validateSeriesPosition(normalized, seriesPositions, entry.path);

    const newSource = replaceMetadataBlock(entry.source, normalized);
    if (newSource && newSource !== entry.source) {
      if (isCheck) {
        changedFiles.add(entry.path);
      } else {
        await writeFile(entry.path, newSource, "utf8");
      }
    }

    const post = {
      id: normalized.id,
      title: normalized.title,
      description: normalized.description ?? "",
      summary: normalized.summary ?? "",
      series: normalized.series ?? null,
      seriesOrder: normalized.seriesOrder ?? null,
      publishedAt: normalized.publishedAt,
      updatedAt: normalized.updatedAt ?? null,
      status: normalized.status,
      tags: normalized.tags ?? [],
      readingTimeMinutes: normalized.readingTimeMinutes ?? 1,
      path: `/${entry.year}/${entry.id}`,
    };

    registryPosts.push({
      year: entry.year,
      slug: entry.id,
      status: post.status,
    });

    if (!publishedOnly || post.status === "published") {
      manifest.posts.push(post);
    }
  }

  manifest.posts.sort((a, b) => {
    if (a.publishedAt === b.publishedAt) return 0;
    return a.publishedAt > b.publishedAt ? -1 : 1;
  });

  const manifestJSON = JSON.stringify(manifest, null, 2);
  const registrySource = createPostRegistrySource(registryPosts, {
    publishedOnly,
  });

  if (isCheck) {
    let existing = "";
    try {
      existing = await readFile(POSTS_MANIFEST_PATH, "utf8");
    } catch {
      // Missing manifest counts as a change in check mode.
    }

    if (existing !== manifestJSON) {
      changedFiles.add(POSTS_MANIFEST_PATH);
    }

    let existingRegistry = "";
    try {
      existingRegistry = await readFileFromDisk(POSTS_REGISTRY_PATH, "utf8");
    } catch {
      // Missing generated registry counts as a change in check mode.
    }
    if (existingRegistry !== registrySource) {
      changedFiles.add(POSTS_REGISTRY_PATH);
    }
  } else {
    await writeManifest(manifest);
    await writeFile(POSTS_REGISTRY_PATH, registrySource, "utf8");
  }

  if (isCheck) {
    if (changedFiles.size > 0) {
      console.error(
        "Posts metadata or manifest need to be synchronized:\n" +
          [...changedFiles].map(file => ` - ${file}`).join("\n")
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

function validateSeriesMetadata(entry, metadata) {
  const rawSeries = entry.metadata.series;
  const rawSeriesOrder = entry.metadata.seriesOrder;

  if (rawSeries != null && typeof rawSeries !== "string") {
    throw new Error(`${entry.path} series must be a string.`);
  }

  if (!metadata.series) {
    if (rawSeriesOrder != null && rawSeriesOrder !== "") {
      throw new Error(`${entry.path} seriesOrder requires a series.`);
    }
    return;
  }

  if (!isKnownSeries(metadata.series)) {
    throw new Error(
      `${entry.path} has undefined series: ${metadata.series}. ` +
        `Choose from: ${SERIES.map(series => series.slug).join(", ")}`
    );
  }

  if (!Number.isInteger(metadata.seriesOrder) || metadata.seriesOrder < 1) {
    throw new Error(
      `${entry.path} seriesOrder must be a positive integer when series is set.`
    );
  }
}

function validateSeriesPosition(metadata, positions, path) {
  if (metadata.status === "archived" || !metadata.series) {
    return;
  }

  const key = `${metadata.series}:${metadata.seriesOrder}`;
  const existingPath = positions.get(key);
  if (existingPath) {
    throw new Error(
      `Series "${metadata.series}" has duplicate position ${metadata.seriesOrder} ` +
        `in ${existingPath} and ${path}.`
    );
  }

  positions.set(key, path);
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
