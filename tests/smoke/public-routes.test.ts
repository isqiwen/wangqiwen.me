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

test("serves the site, about and article sharing images from the packaged runtime", async () => {
  for (const path of ["/opengraph-image", "/about/opengraph-image", `${publishedPostPath}/opengraph-image`]) {
    const response = await fetch(`${baseUrl}${path}`);
    assert.equal(response.status, 200, path);
    assert.match(response.headers.get("content-type") ?? "", /image\/png/, path);
    assert.deepEqual(Array.from(new Uint8Array(await response.arrayBuffer()).slice(0, 8)), [137, 80, 78, 71, 13, 10, 26, 10], path);
  }
});

test("serves static assets referenced by the home page", async () => {
  const html = await (await fetch(`${baseUrl}/`)).text();
  const assets = [...new Set([...html.matchAll(/(?:src|href)="(\/_next\/static\/[^"?]+)(?:\?[^"]*)?"/g)].map(match => match[1]))];
  assert.ok(assets.length > 0, "Home page must reference compiled assets");
  for (const asset of assets) {
    assert.equal((await fetch(`${baseUrl}${asset}`)).status, 200, asset);
  }
});

test("sends security headers with pages, APIs, static files and blocked routes", async () => {
  for (const path of ["/", publishedPostPath, "/api/posts", "/robots.txt", "/editor"]) {
    const { headers } = await fetch(`${baseUrl}${path}`);
    assert.equal(headers.get("x-content-type-options"), "nosniff", path);
    assert.equal(headers.get("x-frame-options"), "SAMEORIGIN", path);
    assert.equal(headers.get("referrer-policy"), "strict-origin-when-cross-origin", path);
    assert.match(headers.get("strict-transport-security") ?? "", /^max-age=\d+$/, path);
    assert.match(headers.get("permissions-policy") ?? "", /camera=\(\)/, path);
    assert.match(headers.get("content-security-policy") ?? "", /frame-ancestors 'self'/, path);
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

test("stays healthy and serves pages without a view-count store", async () => {
  const response = await fetch(`${baseUrl}/api/health`);
  const body = await response.json() as { status?: string; views?: string; timestamp?: string; checks?: unknown };
  assert.equal(response.status, 200);
  assert.equal(body.status, "ok");
  assert.equal(body.views, "disabled");
  assert.equal(body.checks, undefined);
  assert.ok(body.timestamp && !Number.isNaN(Date.parse(body.timestamp)));
});

test("answers view-count requests without a store and never counts private articles", async () => {
  const published = publishedPostPath.split("/").at(-1)!;
  const single = await fetch(`${baseUrl}/api/view?id=${published}&incr=1`);
  assert.equal(single.status, 200);
  assert.deepEqual(await single.json(), { id: published, views: null });

  const list = await fetch(`${baseUrl}/api/posts/views?ids=${published}`);
  assert.equal(list.status, 200);
  assert.deepEqual(await list.json(), {});

  for (const post of privatePosts) {
    const response = await fetch(`${baseUrl}/api/view?id=${post.id}&incr=1`);
    assert.equal(response.status, 400, post.id);
  }
  assert.equal((await fetch(`${baseUrl}/api/view?id=Not_A_Slug`)).status, 400);
});

test("serves prerendered pages without regenerating them", async () => {
  for (const path of ["/", "/topics", publishedPostPath]) {
    const response = await fetch(`${baseUrl}${path}`);
    assert.match(response.headers.get("x-nextjs-prerender") ?? "", /^1\b/, path);
    // A page with a regeneration period advertises it as a short s-maxage.
    assert.match(response.headers.get("cache-control") ?? "", /s-maxage=31536000/, path);
  }
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
