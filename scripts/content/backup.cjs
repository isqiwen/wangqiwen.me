#!/usr/bin/env node

const { cp, mkdir, writeFile } = require("fs/promises");
const { join } = require("path");

async function main() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const destinationRoot = join(process.cwd(), "backups", "site-content", timestamp);

  await mkdir(destinationRoot, { recursive: true });

  const targets = [
    ["app/(post)", "app/(post)"],
    ["posts/manifest.json", "posts/manifest.json"],
    ["public/images", "public/images"],
    ["site.config.js", "site.config.js"],
    ["links.json", "links.json"],
  ];

  for (const [source, destination] of targets) {
    await cp(join(process.cwd(), source), join(destinationRoot, destination), {
      recursive: true,
      force: true,
    });
  }

  await writeFile(
    join(destinationRoot, "README.txt"),
    [
      "Site content backup created by pnpm backup:content.",
      "",
      `Created at: ${new Date().toISOString()}`,
      "Includes posts, manifest, public images, site config, and links.",
    ].join("\n"),
    "utf8",
  );

  console.log(`Content backup created at ${destinationRoot}`);
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
