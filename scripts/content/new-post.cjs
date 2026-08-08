#!/usr/bin/env node

const { join } = require("path");
const { mkdir, writeFile, stat } = require("fs/promises");
const { spawnSync } = require("child_process");
const { normalizeTags } = require("./lib/posts");
const { TOPICS, getUnknownTopics } = require("./lib/topics");
const { SERIES, isKnownSeries } = require("./lib/series");

const POSTS_ROOT = join(process.cwd(), "app", "(post)");

function parseArgs(argv) {
  const options = {};

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

async function ensureDir(path) {
  await mkdir(path, { recursive: true });
}

async function exists(path) {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

async function createPostFile(year, slug, metadata) {
  const dir = join(POSTS_ROOT, year, slug);
  await ensureDir(dir);
  const contents = `export const metadata = ${JSON.stringify(
    metadata,
    null,
    2
  )};\n\nStart writing here.\n`;
  await writeFile(join(dir, "article.mdx"), contents, "utf8");
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
      `\nAllowed topics: ${TOPICS.map(topic => topic.name).join(", ")}`
    );
    return;
  }

  const slug = args.slug.trim();
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || slug.length > 100) {
    throw new Error(
      "Invalid slug. Use 1-100 lowercase letters, numbers, and single hyphens."
    );
  }
  const title = args.title?.trim();
  const description = args.description?.trim();
  if (!title || !description) {
    throw new Error("New posts require both --title and --description.");
  }
  if (args.date && !/^\d{4}-\d{2}-\d{2}$/.test(args.date)) {
    throw new Error("Invalid date. Use YYYY-MM-DD.");
  }
  const dateValue = args.date ? new Date(args.date) : new Date();
  if (
    Number.isNaN(dateValue.getTime()) ||
    (args.date && dateValue.toISOString().slice(0, 10) !== args.date)
  ) {
    throw new Error("Invalid date. Use YYYY-MM-DD.");
  }

  const publishedAt = dateValue.toISOString().slice(0, 10);
  const year = publishedAt.slice(0, 4);
  const tags = normalizeTags(args.tags);
  const unknownTopics = getUnknownTopics(tags);
  if (unknownTopics.length > 0) {
    throw new Error(
      `Unknown topics: ${unknownTopics.join(", ")}. ` +
        `Choose from: ${TOPICS.map(topic => topic.name).join(", ")}`
    );
  }
  const metadata = {
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
        `Unknown series: ${series}. Choose from: ${SERIES.map(
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

  const sync = spawnSync(
    process.execPath,
    ["scripts/content/sync-posts.cjs", "--silent"],
    {
      stdio: "inherit",
    }
  );
  if (sync.error) {
    throw new Error(
      `Post metadata sync could not start: ${sync.error.message}`
    );
  }
  if (sync.status !== 0) {
    throw new Error(
      `Post was created, but metadata sync failed with exit code ${sync.status}.`
    );
  }
  console.log("Post metadata synchronized and manifest updated.");
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
