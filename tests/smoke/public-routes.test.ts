import assert from "node:assert/strict";
import { spawn, type ChildProcess } from "node:child_process";
import { once } from "node:events";
import { readFile } from "node:fs/promises";
import net from "node:net";
import { join, resolve } from "node:path";
import { after, before, test } from "node:test";

type ManifestPost = { path: string; id: string; status: string };
const ROOT_DIR = process.cwd();
const APP_DIR = process.env.SMOKE_APP_DIR
  ? resolve(process.env.SMOKE_APP_DIR)
  : join(ROOT_DIR, ".next", "standalone");
const STARTUP_TIMEOUT_MS = 20_000;
let app: ChildProcess | undefined;
let baseUrl = "";
let logs = "";
let publishedPostPath = "";
let privatePosts: ManifestPost[] = [];

before(async () => {
  const manifest = JSON.parse(await readFile(join(ROOT_DIR, "posts", "manifest.json"), "utf8")) as { posts: ManifestPost[] };
  publishedPostPath = manifest.posts.find(post => post.status === "published")?.path ?? "";
  privatePosts = manifest.posts.filter(post => post.status === "draft" || post.status === "archived");
  if (!publishedPostPath) throw new Error("Smoke tests require at least one published article.");
  if (process.env.CI) {
    assert.ok(privatePosts.some(post => post.status === "draft"), "CI must build a real draft fixture");
    assert.ok(privatePosts.some(post => post.status === "archived"), "CI must build a real archived fixture");
  }
  const port = await getAvailablePort();
  baseUrl = `http://127.0.0.1:${port}`;
  app = spawn(process.execPath, [join(APP_DIR, "server.js")], {
    cwd: APP_DIR,
    env: {
      ...process.env, GEO_IP_API_KEY: "", HOSTNAME: "127.0.0.1",
      NEXT_TELEMETRY_DISABLED: "1", NODE_ENV: "production", PORT: String(port),
      UPSTASH_REDIS_REST_TOKEN: "", UPSTASH_REDIS_REST_URL: "",
    },
    stdio: ["ignore", "pipe", "pipe"],
  });
  app.stdout?.on("data", chunk => { logs += chunk.toString(); });
  app.stderr?.on("data", chunk => { logs += chunk.toString(); });
  app.on("error", error => { logs += String(error); });
  const deadline = Date.now() + STARTUP_TIMEOUT_MS;
  while (Date.now() < deadline) {
    if (app.exitCode !== null) throw new Error(`Standalone server exited:\n${logs}`);
    try { if ((await fetch(`${baseUrl}/robots.txt`)).ok) return; } catch { /* still starting */ }
    await delay(100);
  }
  throw new Error(`Standalone server did not become ready:\n${logs}`);
});

after(async () => {
  if (!app || app.exitCode !== null) return;
  const exited = once(app, "exit");
  app.kill("SIGTERM");
  await Promise.race([exited, delay(5_000)]);
  if (app.exitCode === null) {
    app.kill("SIGKILL");
    await exited;
  }
});

test("serves public pages from the packaged runtime", async () => {
  for (const path of ["/", "/about", "/topics", "/series", publishedPostPath]) {
    const response = await fetch(`${baseUrl}${path}`);
    assert.equal(response.status, 200, path);
    assert.match(response.headers.get("content-type") ?? "", /text\/html/, path);
    assert.match(await response.text(), /<main/, path);
  }
});

test("serves a real article sharing image from the packaged runtime", async () => {
  const response = await fetch(`${baseUrl}${publishedPostPath}/opengraph-image`);
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /image\/png/);
  assert.deepEqual(Array.from(new Uint8Array(await response.arrayBuffer()).slice(0, 8)), [137, 80, 78, 71, 13, 10, 26, 10]);
});

test("serves static assets referenced by the home page", async () => {
  const html = await (await fetch(`${baseUrl}/`)).text();
  const assets = [...new Set([...html.matchAll(/(?:src|href)="(\/_next\/static\/[^"?]+)(?:\?[^"]*)?"/g)].map(match => match[1]))];
  assert.ok(assets.length > 0, "Home page must reference compiled assets");
  for (const asset of assets) {
    assert.equal((await fetch(`${baseUrl}${asset}`)).status, 200, asset);
  }
});

test("does not serve actual draft or archived article routes and sharing images", async () => {
  for (const post of privatePosts) {
    for (const suffix of ["", "/opengraph-image"]) {
      const response = await fetch(`${baseUrl}${post.path}${suffix}`);
      assert.equal(response.status, 404, `${post.status}: ${post.path}${suffix}`);
    }
  }
});

test("does not disclose private articles in public indexes", async () => {
  for (const path of ["/api/posts", "/sitemap.xml", "/atom"]) {
    const response = await fetch(`${baseUrl}${path}`);
    assert.equal(response.status, 200, path);
    const body = await response.text();
    for (const post of privatePosts) assert.equal(body.includes(post.id), false, `${path} exposes ${post.id}`);
    if (path === "/atom") assert.match(response.headers.get("content-type") ?? "", /application\/atom\+xml/);
  }
});

test("blocks editor pages and API methods in production", async () => {
  for (const path of ["/editor", "/editor/components", "/api/editor", "/api/editor/list", "/api/editor/assets", "/api/editor/changes", "/api/editor/publish", "/api/editor/upload"]) {
    for (const method of ["GET", "POST", "DELETE"]) {
      assert.equal((await fetch(`${baseUrl}${path}`, { method })).status, 404, `${method} ${path}`);
    }
  }
});

test("reports missing production Redis configuration as degraded", async () => {
  const response = await fetch(`${baseUrl}/api/health`);
  const body = await response.json() as { status?: string; timestamp?: string };
  assert.equal(response.status, 503);
  assert.equal(body.status, "degraded");
  assert.ok(body.timestamp && !Number.isNaN(Date.parse(body.timestamp)));
});

async function getAvailablePort(): Promise<number> {
  const server = net.createServer();
  return new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      if (!address || typeof address === "string") {
        server.close(); reject(new Error("Could not reserve a test port.")); return;
      }
      server.close(error => error ? reject(error) : resolve(address.port));
    });
  });
}
function delay(ms: number): Promise<void> { return new Promise(resolve => setTimeout(resolve, ms)); }
