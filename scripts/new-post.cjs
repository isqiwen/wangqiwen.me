#!/usr/bin/env node

const { join } = require("path");
const { mkdir, writeFile, stat } = require("fs/promises");
const { spawnSync } = require("child_process");
const { normalizeTags } = require("./lib/posts");

const POSTS_ROOT = join(process.cwd(), "app", "(post)");

function parseArgs(argv) {
  const options = {
    locales: ["zh"],
  };

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
    } else if (arg === "--cover" && argv[i + 1]) {
      options.cover = argv[i + 1];
      i += 1;
    } else if (arg.startsWith("--cover=")) {
      options.cover = arg.slice(8);
    } else if (arg === "--featured") {
      options.featured = true;
    } else if (arg === "--with-en") {
      if (!options.locales.includes("en")) {
        options.locales.push("en");
      }
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

async function createPostFile(locale, year, slug, metadata, description) {
  const dir = join(POSTS_ROOT, locale, year, slug);
  await ensureDir(dir);
  const body = description ? `\n${description}\n` : "\nStart writing here.\n";
  const contents = `export const metadata = ${JSON.stringify(metadata, null, 2)};\n${body}`;
  await writeFile(join(dir, "page.mdx"), contents, "utf8");
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.help || !args.slug) {
    console.log(`Usage: pnpm new:post --slug my-post [options]

Options:
  --title "My title"
  --description "Short summary"
  --summary "Homepage summary"
  --date 2024-12-01
  --updated-at 2024-12-05
  --tags "react,nextjs"
  --series "Editor Workflow"
  --cover "/images/my-post/cover.jpg"
  --featured
  --with-en
  --published

By default, new posts are created as drafts.`);
    return;
  }

  const slug = args.slug.trim();
  const dateValue = args.date ? new Date(args.date) : new Date();
  if (Number.isNaN(dateValue.getTime())) {
    throw new Error("Invalid date. Use YYYY-MM-DD.");
  }

  const publishedAt = dateValue.toISOString().slice(0, 10);
  const year = publishedAt.slice(0, 4);
  const metadata = {
    title: args.title || slug,
    description: args.description || "",
    summary: args.summary || "",
    publishedAt,
    status: args.published ? "published" : "draft",
    id: slug,
    tags: normalizeTags(args.tags),
  };

  if (args.updatedAt) {
    metadata.updatedAt = args.updatedAt;
  }

  if (args.series) {
    metadata.series = args.series;
  }

  if (args.cover) {
    metadata.cover = args.cover;
  }

  if (args.featured) {
    metadata.featured = true;
  }

  for (const locale of args.locales) {
    const targetPath = join(POSTS_ROOT, locale, year, slug, "page.mdx");
    if (await exists(targetPath)) {
      throw new Error(`${locale}/${year}/${slug} already exists.`);
    }
    await createPostFile(locale, year, slug, metadata, "");
    console.log(`Created ${locale} post: ${locale}/${year}/${slug}`);
  }

  spawnSync("node", ["scripts/normalize-post-metadata.cjs", "--silent"], {
    stdio: "inherit",
  });
  console.log("Post metadata synchronized and manifest updated.");
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
