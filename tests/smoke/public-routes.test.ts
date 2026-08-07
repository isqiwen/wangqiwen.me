import assert from "node:assert/strict";
import { spawn, type ChildProcess } from "node:child_process";
import { once } from "node:events";
import { readFile } from "node:fs/promises";
import net from "node:net";
import { join } from "node:path";
import { after, before, test } from "node:test";

const ROOT_DIR = process.cwd();
const SERVER_PATH = join(ROOT_DIR, ".next", "standalone", "server.js");
const STARTUP_TIMEOUT_MS = 20_000;

let app: ChildProcess | undefined;
let baseUrl = "";
let logs = "";
let publishedPostPath = "";

before(async () => {
  const port = await getAvailablePort();
  publishedPostPath = await getPublishedPostPath();
  baseUrl = `http://127.0.0.1:${port}`;
  app = spawn(process.execPath, [SERVER_PATH], {
    cwd: ROOT_DIR,
    env: {
      ...process.env,
      GEO_IP_API_KEY: "",
      HOSTNAME: "127.0.0.1",
      NEXT_TELEMETRY_DISABLED: "1",
      NODE_ENV: "production",
      PORT: String(port),
      UPSTASH_REDIS_REST_TOKEN: "",
      UPSTASH_REDIS_REST_URL: "",
    },
    stdio: ["ignore", "pipe", "pipe"],
  });

  app.stdout?.on("data", chunk => {
    logs += chunk.toString();
  });
  app.stderr?.on("data", chunk => {
    logs += chunk.toString();
  });

  await waitForServer();
});

after(async () => {
  if (!app || app.exitCode !== null) return;

  const exited = once(app, "exit");
  app.kill("SIGTERM");
  await Promise.race([exited, delay(5_000)]);

  if (app.exitCode === null) {
    app.kill("SIGKILL");
    await once(app, "exit");
  }
});

test("serves the home page", async () => {
  const response = await fetch(`${baseUrl}/`);

  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /text\/html/);
  assert.match(await response.text(), /<main/);
});

test("serves a published article", async () => {
  const response = await fetch(`${baseUrl}${publishedPostPath}`);

  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /text\/html/);
  const body = await response.text();
  assert.match(body, /href="\/topics\//);
  assert.match(body, /Related writing/);
  assert.doesNotMatch(body, /data-view-count/);
});

test("does not serve an unpublished article URL", async () => {
  const response = await fetch(`${baseUrl}/2099/unpublished-draft`);

  assert.equal(response.status, 404);
});

test("serves the topics index", async () => {
  const response = await fetch(`${baseUrl}/topics`);

  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /text\/html/);
  assert.match(await response.text(), /Topics/);
});

test("serves a topic page", async () => {
  const response = await fetch(`${baseUrl}/topics/frontend`);

  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /text\/html/);
  assert.match(await response.text(), /Frontend/);
});

test("serves the Atom feed", async () => {
  const response = await fetch(`${baseUrl}/atom`);

  assert.equal(response.status, 200);
  assert.match(
    response.headers.get("content-type") ?? "",
    /application\/atom\+xml/
  );
  assert.match(
    await response.text(),
    /<feed xmlns="http:\/\/www\.w3\.org\/2005\/Atom">/
  );
});

test("reports missing required production configuration", async () => {
  const response = await fetch(`${baseUrl}/api/health`);
  const body = (await response.json()) as {
    status?: unknown;
    timestamp?: unknown;
  };

  assert.equal(response.status, 503);
  assert.equal(body.status, "degraded");
  assert.ok(typeof body.timestamp === "string");
  assert.equal(Number.isNaN(Date.parse(body.timestamp)), false);
});

async function getAvailablePort(): Promise<number> {
  const server = net.createServer();

  return new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      if (!address || typeof address === "string") {
        server.close();
        reject(new Error("Could not reserve a local port for the smoke test."));
        return;
      }

      server.close(error => (error ? reject(error) : resolve(address.port)));
    });
  });
}

async function getPublishedPostPath(): Promise<string> {
  const source = await readFile(
    join(ROOT_DIR, "posts", "manifest.json"),
    "utf8"
  );
  const manifest = JSON.parse(source) as {
    posts?: Array<{ path?: string; status?: string }>;
  };
  const path = manifest.posts?.find(post => post.status === "published")?.path;

  if (!path) {
    throw new Error(
      "The smoke test requires one published post in posts/manifest.json."
    );
  }

  return path;
}

async function waitForServer(): Promise<void> {
  const deadline = Date.now() + STARTUP_TIMEOUT_MS;
  let lastError: unknown;

  while (Date.now() < deadline) {
    if (app?.exitCode !== null) {
      throw new Error(`Standalone server exited during startup:\n${logs}`);
    }

    try {
      const response = await fetch(`${baseUrl}/robots.txt`);
      if (response.ok) return;
      lastError = new Error(`Health check returned ${response.status}`);
    } catch (error) {
      lastError = error;
    }

    await delay(100);
  }

  throw new Error(
    `Standalone server did not become ready within ${STARTUP_TIMEOUT_MS}ms. ${String(
      lastError
    )}\n${logs}`
  );
}

function delay(duration: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, duration));
}
