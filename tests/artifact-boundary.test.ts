import assert from "node:assert/strict";
import { test } from "node:test";
import { mkdtemp, mkdir, writeFile, readFile, readdir, rm, symlink } from "node:fs/promises";
import { join, dirname } from "node:path";
import { tmpdir } from "node:os";
import { assembleArtifact } from "../scripts/vps/assemble-artifact.cjs";

async function fixture() {
  const root = await mkdtemp(join(tmpdir(), "blog-artifact-test-"));
  const build = join(root, "build");
  const bundle = join(root, "bundle");
  async function write(file: string, contents = "fixture") {
    const destination = join(build, file);
    await mkdir(dirname(destination), { recursive: true });
    await writeFile(destination, contents);
  }
  await write(".next/standalone/server.js");
  await write(".next/standalone/package.json", "{}");
  await write(".next/standalone/node_modules/example/index.js");
  await write(".next/standalone/.next/server/app/page.js");
  await write(".next/static/chunks/main.js");
  await write("public/images/figure.svg");
  await write("posts/manifest.json", JSON.stringify({ posts: [{ id: "public", status: "published" }] }));
  return { root, build, bundle, write };
}

async function files(root: string, prefix = ""): Promise<string[]> {
  const result: string[] = [];
  for (const entry of await readdir(join(root, prefix), { withFileTypes: true })) {
    const relative = join(prefix, entry.name);
    result.push(relative);
    if (entry.isDirectory()) result.push(...await files(root, relative));
  }
  return result;
}

test("assembles only runtime files and excludes backups, env files and article source", async () => {
  const f = await fixture();
  try {
    await f.write("backups/site-content/old/app/(post)/2026/draft/article.mdx", "PRIVATE_DRAFT");
    await f.write("app/(post)/2026/draft/article.mdx", "PRIVATE_DRAFT");
    await f.write(".env.production", "PRIVATE_TOKEN");
    await f.write(".next/standalone/.env.production", "PRIVATE_TOKEN");
    await f.write(".next/standalone/backups/copy.mdx", "PRIVATE_DRAFT");
    await f.write(".next/standalone/app/(post)/2026/draft/article.mdx", "PRIVATE_DRAFT");
    await f.write(".next/standalone/node_modules/example/.env.local", "PRIVATE_TOKEN");
    await assembleArtifact(f.build, f.bundle);
    const output = await files(f.bundle);
    assert.ok(output.includes("server.js"));
    assert.ok(output.includes(join("public", "images", "figure.svg")));
    assert.ok(output.includes(join(".next", "static", "chunks", "main.js")));
    assert.ok(output.includes(join("posts", "manifest.json")));
    assert.equal(output.some(file => /backups|\.env|article\.mdx/.test(file)), false);
  } finally { await rm(f.root, { recursive: true, force: true }); }
});

test("rejects draft and archived metadata in a deployment manifest", async () => {
  for (const status of ["draft", "archived", "invalid"]) {
    const f = await fixture();
    try {
      await f.write("posts/manifest.json", JSON.stringify({ posts: [{ id: "private", status }] }));
      await assert.rejects(assembleArtifact(f.build, f.bundle), /only published/);
    } finally { await rm(f.root, { recursive: true, force: true }); }
  }
});

test("rejects a non-empty destination instead of reusing stale files", async () => {
  const f = await fixture();
  try {
    await mkdir(f.bundle);
    await writeFile(join(f.bundle, "old-secret"), "private");
    await assert.rejects(assembleArtifact(f.build, f.bundle), /must be empty/);
  } finally { await rm(f.root, { recursive: true, force: true }); }
});

test("preserves internal dependency symlinks and rejects escaping symlinks", async () => {
  const f = await fixture();
  try {
    const modules = join(f.build, ".next", "standalone", "node_modules");
    await symlink("example", join(modules, "alias"), "dir");
    await assembleArtifact(f.build, f.bundle);
    assert.equal(await readFile(join(f.bundle, "node_modules", "alias", "index.js"), "utf8"), "fixture");
    await rm(f.bundle, { recursive: true, force: true });
    await symlink(f.root, join(modules, "outside"), "dir");
    await assert.rejects(assembleArtifact(f.build, f.bundle), /symlink escapes/);
  } finally { await rm(f.root, { recursive: true, force: true }); }
});
