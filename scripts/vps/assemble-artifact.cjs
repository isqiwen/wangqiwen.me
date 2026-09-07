#!/usr/bin/env node

const fs = require("node:fs/promises");
const path = require("node:path");

const STANDALONE_ENTRIES = ["server.js", "package.json", "node_modules", ".next"];
const PRIVATE_NAMES = new Set([
  ".git", "backups", "test-results", "playwright-report", ".pnpm-store",
]);

function isPrivateEntry(relativePath) {
  return relativePath.split(/[\\/]/).some(part =>
    part.startsWith(".env") || PRIVATE_NAMES.has(part)
  );
}

async function copyPublicTree(source, destination) {
  await fs.cp(source, destination, {
    recursive: true,
    dereference: false,
    // Keep pnpm's links relative to the artifact, not the temporary workspace.
    verbatimSymlinks: true,
    filter: entry => !isPrivateEntry(path.relative(source, entry)),
  });
}

async function validateBundle(directory, root = directory) {
  for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, entry.name);
    const relative = path.relative(root, fullPath);
    if (isPrivateEntry(relative)) {
      throw new Error(`Private file in deployment artifact: ${relative}`);
    }
    if (entry.isSymbolicLink()) {
      const target = await fs.realpath(fullPath);
      const resolved = path.relative(root, target);
      if (resolved === ".." || resolved.startsWith(`..${path.sep}`) || path.isAbsolute(resolved)) {
        throw new Error(`Artifact symlink escapes its root: ${relative}`);
      }
    } else if (entry.isDirectory()) {
      await validateBundle(fullPath, root);
    }
  }
}

async function assembleArtifact(buildRoot, bundleRoot) {
  buildRoot = path.resolve(buildRoot);
  bundleRoot = path.resolve(bundleRoot);
  await fs.mkdir(bundleRoot, { recursive: true });
  if ((await fs.readdir(bundleRoot)).length !== 0) {
    throw new Error("Artifact destination must be empty.");
  }

  const standalone = path.join(buildRoot, ".next", "standalone");
  for (const entry of STANDALONE_ENTRIES) {
    await copyPublicTree(path.join(standalone, entry), path.join(bundleRoot, entry));
  }
  await copyPublicTree(path.join(buildRoot, ".next", "static"), path.join(bundleRoot, ".next", "static"));
  await copyPublicTree(path.join(buildRoot, "public"), path.join(bundleRoot, "public"));

  const manifest = JSON.parse(await fs.readFile(path.join(buildRoot, "posts", "manifest.json"), "utf8"));
  if (!Array.isArray(manifest.posts) || manifest.posts.some(post => post.status !== "published")) {
    throw new Error("Deployment manifest must contain only published posts.");
  }
  await fs.mkdir(path.join(bundleRoot, "posts"), { recursive: true });
  await fs.writeFile(path.join(bundleRoot, "posts", "manifest.json"), JSON.stringify(manifest, null, 2));
  await validateBundle(bundleRoot);
}

module.exports = { assembleArtifact, isPrivateEntry, validateBundle };

if (require.main === module) {
  const [buildRoot, bundleRoot] = process.argv.slice(2);
  if (!buildRoot || !bundleRoot) {
    console.error("Usage: node scripts/vps/assemble-artifact.cjs BUILD_ROOT EMPTY_BUNDLE_ROOT");
    process.exitCode = 1;
  } else {
    assembleArtifact(buildRoot, bundleRoot).catch(error => {
      console.error(error);
      process.exitCode = 1;
    });
  }
}
