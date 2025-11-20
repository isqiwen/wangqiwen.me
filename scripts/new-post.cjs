#!/usr/bin/env node

const { join } = require("path");
const { mkdir, writeFile, stat } = require("fs/promises");
const { spawnSync } = require("child_process");

const POSTS_ROOT = join(process.cwd(), "app", "(post)");

function parseArgs(argv) {
  const options = {
    locales: ["zh"],
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--slug" && argv[i + 1]) {
      options.slug = argv[i + 1];
      i += 1;
    } else if (arg.startsWith("--slug=")) {
      options.slug = arg.slice(7);
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
    } else if (arg === "--date" && argv[i + 1]) {
      options.date = argv[i + 1];
      i += 1;
    } else if (arg.startsWith("--date=")) {
      options.date = arg.slice(7);
    } else if (arg === "--with-en") {
      if (!options.locales.includes("en")) {
        options.locales.push("en");
      }
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
  const body = description ? `\n${description}\n` : "\n开始写作吧。\n";
  const contents = `export const metadata = ${JSON.stringify(metadata, null, 2)};\n${body}`;
  await writeFile(join(dir, "page.mdx"), contents, "utf8");
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.help || !args.slug) {
    console.log(`用法: pnpm new:post --slug my-post [--title 标题] [--description 描述] [--date 2024-12-01] [--with-en]\n默认仅创建中文文章，可添加 --with-en 同时生成英文草稿。`);
    return;
  }

  const slug = args.slug.trim();
  const dateValue = args.date ? new Date(args.date) : new Date();
  if (Number.isNaN(dateValue.getTime())) {
    throw new Error("无效的日期，请使用 YYYY-MM-DD 格式。");
  }
  const publishedAt = dateValue.toISOString().slice(0, 10);
  const year = publishedAt.slice(0, 4);
  const baseMetadata = {
    title: args.title || slug,
    description: args.description || "",
    publishedAt,
    id: slug,
  };

  for (const locale of args.locales) {
    const metadata = { ...baseMetadata };
    const targetPath = join(POSTS_ROOT, locale, year, slug, "page.mdx");
    if (await exists(targetPath)) {
      throw new Error(`${locale}/${year}/${slug} 已存在，无法覆盖。`);
    }
    await createPostFile(locale, year, slug, metadata, "");
    console.log(`已创建 ${locale} 文章: ${locale}/${year}/${slug}`);
  }

  spawnSync("node", ["scripts/normalize-post-metadata.cjs", "--silent"], {
    stdio: "inherit",
  });
  console.log("已同步文章元数据并更新 manifest。");
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
