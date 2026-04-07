#!/usr/bin/env node

const { mkdir, readdir, rm, writeFile } = require("fs/promises");
const { join } = require("path");
const { spawnSync } = require("child_process");

const POSTS_ROOT = join(process.cwd(), "app", "(post)");
const IMAGES_ROOT = join(process.cwd(), "public", "images");
const PLACEHOLDER_IMAGES = new Set([
  "avatar-placeholder.svg",
  "avatar-placeholder-muted.svg",
]);

async function main() {
  const args = new Set(process.argv.slice(2));

  if (!args.has("--force")) {
    console.error(
      "This command removes all post content and article images. Re-run with --force if that is intentional.",
    );
    process.exitCode = 1;
    return;
  }

  spawnSync("node", ["scripts/backup-content.cjs"], {
    stdio: "inherit",
  });

  for (const locale of ["zh", "en"]) {
    const localeDir = join(POSTS_ROOT, locale);
    const entries = await safeReadDir(localeDir);
    for (const entry of entries) {
      await rm(join(localeDir, entry), { recursive: true, force: true });
    }
  }

  const imageEntries = await safeReadDir(IMAGES_ROOT);
  for (const entry of imageEntries) {
    if (PLACEHOLDER_IMAGES.has(entry)) {
      continue;
    }

    await rm(join(IMAGES_ROOT, entry), { recursive: true, force: true });
  }

  await mkdir(join(process.cwd(), "posts"), { recursive: true });
  await writeFile(
    join(process.cwd(), "posts", "manifest.json"),
    JSON.stringify(
      {
        locales: ["zh", "en"],
        posts: {
          zh: [],
          en: [],
        },
        translations: {},
      },
      null,
      2,
    ),
    "utf8",
  );

  await writeFile(join(process.cwd(), "links.json"), "{}\n", "utf8");

  console.log("Site content reset complete. Create new posts with pnpm new:post --id my-first-post.");
}

async function safeReadDir(target) {
  try {
    return await readdir(target);
  } catch {
    return [];
  }
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
