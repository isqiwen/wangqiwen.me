#!/usr/bin/env node

import { mkdir, stat, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { POSTS_ROOT } from "../../utils/server/post-files";
import {
  PostsValidationError,
  syncPostsMetadata,
} from "../../utils/server/sync-posts";
import {
  isIsoDate,
  isPostSlug,
  normalizeTags,
} from "../../utils/shared/post-fields";
import { formatExportedMetadata } from "../../utils/shared/post-metadata";
import { isKnownSeries, SERIES_DEFINITIONS } from "../../utils/series";
import { getUnknownTopics, TOPIC_DEFINITIONS } from "../../utils/topics";

type NewPostOptions = {
  slug?: string;
  title?: string;
  description?: string;
  summary?: string;
  date?: string;
  updatedAt?: string;
  tags?: string;
  series?: string;
  seriesOrder?: string;
  published?: boolean;
  help?: boolean;
};

function parseArgs(argv: string[]): NewPostOptions {
  const options: NewPostOptions = {};

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if ((arg === "--slug" || arg === "--id") && argv[i + 1]) {
      options.slug = argv[i + 1];
      i += 1;
    } else if (arg.startsWith("--slug=") || arg.startsWith("--id=")) {
      options.slug = arg.slice(arg.indexOf("=") + 1);
    } else if (arg === "--title" && argv[i + 1]) {
      options.title = argv[i + 1];
      i += 1;
    } else if (arg.startsWith("--title=")) {
      options.title = arg.slice(8);
    } else if (arg === "--description" && argv[i + 1]) {
      options.description = argv[i + 1];
      i += 1;
    } else if (arg.startsWith("--description=")) {
      options.description = arg.slice(15);
    } else if (arg === "--summary" && argv[i + 1]) {
      options.summary = argv[i + 1];
      i += 1;
    } else if (arg.startsWith("--summary=")) {
      options.summary = arg.slice(10);
    } else if (arg === "--date" && argv[i + 1]) {
      options.date = argv[i + 1];
      i += 1;
    } else if (arg.startsWith("--date=")) {
      options.date = arg.slice(7);
    } else if (arg === "--updated-at" && argv[i + 1]) {
      options.updatedAt = argv[i + 1];
      i += 1;
    } else if (arg.startsWith("--updated-at=")) {
      options.updatedAt = arg.slice(13);
    } else if (arg === "--tags" && argv[i + 1]) {
      options.tags = argv[i + 1];
      i += 1;
    } else if (arg.startsWith("--tags=")) {
      options.tags = arg.slice(7);
    } else if (arg === "--series" && argv[i + 1]) {
      options.series = argv[i + 1];
      i += 1;
    } else if (arg.startsWith("--series=")) {
      options.series = arg.slice(9);
    } else if (arg === "--series-order" && argv[i + 1]) {
      options.seriesOrder = argv[i + 1];
      i += 1;
    } else if (arg.startsWith("--series-order=")) {
      options.seriesOrder = arg.slice(15);
    } else if (arg === "--published") {
      options.published = true;
    } else if (arg === "--help") {
      options.help = true;
    }
  }

  return options;
}

async function exists(path: string) {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

async function createPostFile(
  year: string,
  slug: string,
  metadata: Record<string, unknown>
) {
  const directory = join(POSTS_ROOT, year, slug);
  await mkdir(directory, { recursive: true });
  await writeFile(
    join(directory, "article.mdx"),
    `${formatExportedMetadata(metadata)}Start writing here.\n`,
    "utf8"
  );
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.help || !args.slug) {
    console.log(`Usage: pnpm new:post --slug my-post [options]

Options:
  --title "My title"              Required
  --description "Short summary"   Required
  --summary "Homepage summary"
  --date 2024-12-01
  --updated-at 2024-12-05
  --tags "Frontend,Web Performance"
  --series reliable-web-delivery --series-order 1
  --published

By default, new posts are created as drafts.`);
    console.log(
      `\nAllowed topics: ${TOPIC_DEFINITIONS.map(topic => topic.name).join(
        ", "
      )}`
    );
    return;
  }

  const slug = args.slug.trim();
  if (!isPostSlug(slug)) {
    throw new Error(
      "Invalid slug. Use 1-100 lowercase letters, numbers, and single hyphens."
    );
  }
  const title = args.title?.trim();
  const description = args.description?.trim();
  if (!title || !description) {
    throw new Error("New posts require both --title and --description.");
  }
  if (args.date && !isIsoDate(args.date)) {
    throw new Error("Invalid date. Use YYYY-MM-DD.");
  }

  const publishedAt = args.date ?? new Date().toISOString().slice(0, 10);
  const year = publishedAt.slice(0, 4);
  const tags = normalizeTags((args.tags ?? "").split(","));
  const unknownTopics = getUnknownTopics(tags);
  if (unknownTopics.length > 0) {
    throw new Error(
      `Unknown topics: ${unknownTopics.join(", ")}. ` +
        `Choose from: ${TOPIC_DEFINITIONS.map(topic => topic.name).join(", ")}`
    );
  }
  const metadata: Record<string, unknown> = {
    title,
    description,
    summary: args.summary || "",
    publishedAt,
    status: args.published ? "published" : "draft",
    id: slug,
    tags,
  };

  if (args.updatedAt) {
    metadata.updatedAt = args.updatedAt;
  }

  if (args.series) {
    const series = args.series.trim();
    if (!isKnownSeries(series)) {
      throw new Error(
        `Unknown series: ${series}. Choose from: ${SERIES_DEFINITIONS.map(
          item => item.slug
        ).join(", ")}`
      );
    }
    const seriesOrder = Number(args.seriesOrder);
    if (!Number.isInteger(seriesOrder) || seriesOrder < 1) {
      throw new Error(
        "Posts in a series require --series-order with a positive integer."
      );
    }
    metadata.series = series;
    metadata.seriesOrder = seriesOrder;
  } else if (args.seriesOrder) {
    throw new Error("--series-order requires --series.");
  }

  const targetPath = join(POSTS_ROOT, year, slug, "article.mdx");
  if (await exists(targetPath)) {
    throw new Error(`${year}/${slug} already exists.`);
  }
  await createPostFile(year, slug, metadata);
  console.log(`Created post: ${year}/${slug}`);

  try {
    await syncPostsMetadata({ normalizeSources: true });
  } catch (error) {
    throw new Error(
      `Post was created, but metadata sync failed: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
  console.log("Post metadata synchronized and manifest updated.");
}

main().catch(error => {
  console.error(error instanceof PostsValidationError ? error.message : error);
  process.exitCode = 1;
});
