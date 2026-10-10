import assert from "node:assert/strict";
import test, { afterEach } from "node:test";
import {
  getViewsStoreStatus,
  incrementViews,
  readViews,
} from "@/utils/server/views";

const originalEnvironment = { ...process.env };

// The store is chosen once per process; a test that changes the environment
// has to make the next call choose again.
function useEnvironment(values: Record<string, string>) {
  Object.assign(process.env, values);
  const state = globalThis as Record<string, unknown>;
  delete state.__viewsStore;
  delete state.__upstash;
}

afterEach(() => {
  for (const key of Object.keys(process.env)) {
    if (!(key in originalEnvironment)) delete process.env[key];
  }
  useEnvironment(originalEnvironment as Record<string, string>);
});

test("local work counts in memory and answers zero for unseen posts", async () => {
  useEnvironment({
    NODE_ENV: "development",
    UPSTASH_REDIS_REST_URL: "",
    UPSTASH_REDIS_REST_TOKEN: "",
  });

  assert.equal(await incrementViews("first-post"), 1);
  assert.equal(await incrementViews("first-post"), 2);
  assert.deepEqual(await readViews(["first-post", "second-post"]), {
    "first-post": 2,
    "second-post": 0,
  });
  assert.equal(await getViewsStoreStatus(), "ok");
});

test("local work ignores configured credentials unless the remote store is requested", async () => {
  useEnvironment({
    NODE_ENV: "development",
    UPSTASH_REDIS_REST_URL: "https://127.0.0.1:1",
    UPSTASH_REDIS_REST_TOKEN: "unused",
  });

  // An in-memory answer: the unreachable address was never contacted.
  assert.equal(await incrementViews("local-post"), 1);
});

test("a deployment without a store has no counts and is not unhealthy", async () => {
  useEnvironment({
    NODE_ENV: "production",
    UPSTASH_REDIS_REST_URL: "",
    UPSTASH_REDIS_REST_TOKEN: "",
  });

  assert.equal(await readViews(["first-post"]), null);
  assert.equal(await incrementViews("first-post"), null);
  assert.equal(await getViewsStoreStatus(), "disabled");
});

test("an unreachable store answers null quickly instead of failing the request", async () => {
  useEnvironment({
    NODE_ENV: "production",
    UPSTASH_REDIS_REST_URL: "https://127.0.0.1:1",
    UPSTASH_REDIS_REST_TOKEN: "unused",
  });

  const startedAt = Date.now();
  assert.equal(await readViews(["first-post"]), null);
  assert.equal(await incrementViews("first-post"), null);
  assert.equal(await getViewsStoreStatus(), "unavailable");
  // Three calls, each bounded by one retry and a two-second timeout.
  assert.ok(Date.now() - startedAt < 7000);
});
