import assert from "node:assert/strict";
import test from "node:test";
import { NextResponse } from "next/server";
import { editorRoute } from "@/utils/server/editor-api";
import { PostFileValidationError } from "@/utils/server/post-files";
import { PostPreconditionError } from "@/utils/server/post-version";

// Each test uses its own address, and so its own rate-limit bucket.
function request(ip: string) {
  return new Request("http://127.0.0.1:3000/api/editor", {
    headers: { "x-forwarded-for": ip },
  });
}

function missingFile() {
  return Object.assign(new Error("no such file"), { code: "ENOENT" });
}

test("passes a handler's own response through", async () => {
  const route = editorRoute(
    { action: "test-ok", limit: 10, failureMessage: "failed" },
    async () => NextResponse.json({ ok: true }, { status: 201 })
  );

  const response = await route(request("198.51.100.1"));
  assert.equal(response.status, 201);
  assert.deepEqual(await response.json(), { ok: true });
});

test("turns known failures into the answers the editor understands", async () => {
  const cases: Array<[unknown, number, Record<string, unknown>]> = [
    [
      new PostFileValidationError("title is required"),
      400,
      { error: "title is required" },
    ],
    [
      new PostPreconditionError("changed on disk", 412, "POST_CHANGED"),
      412,
      { error: "changed on disk", code: "POST_CHANGED" },
    ],
    [new Error("disk exploded"), 500, { error: "could not finish" }],
  ];

  for (const [failure, status, body] of cases) {
    const route = editorRoute(
      {
        action: "test-failures",
        limit: 10,
        failureMessage: "could not finish",
      },
      async () => {
        throw failure;
      }
    );
    const response = await route(request("198.51.100.2"));

    assert.equal(response.status, status);
    assert.deepEqual(await response.json(), body);
  }
});

test("a missing file is a 404 only where the route says so", async () => {
  const handler = async () => {
    throw missingFile();
  };
  const reading = editorRoute(
    {
      action: "test-read",
      limit: 10,
      failureMessage: "failed to read",
      missingFileIsNotFound: true,
    },
    handler
  );
  const saving = editorRoute(
    { action: "test-save", limit: 10, failureMessage: "failed to save" },
    handler
  );

  assert.equal((await reading(request("198.51.100.3"))).status, 404);
  const saved = await saving(request("198.51.100.3"));
  assert.equal(saved.status, 500);
  assert.deepEqual(await saved.json(), { error: "failed to save" });
});

test("limits each action per address and never runs in production", async () => {
  let calls = 0;
  const route = editorRoute(
    { action: "test-limit", limit: 2, failureMessage: "failed" },
    async () => {
      calls += 1;
      return NextResponse.json({ ok: true });
    }
  );

  assert.equal((await route(request("198.51.100.4"))).status, 200);
  assert.equal((await route(request("198.51.100.4"))).status, 200);
  const limited = await route(request("198.51.100.4"));
  assert.equal(limited.status, 429);
  assert.ok(limited.headers.get("retry-after"));
  assert.equal(calls, 2);

  const originalMode = process.env.NODE_ENV;
  Object.assign(process.env, { NODE_ENV: "production" });
  try {
    assert.equal((await route(request("198.51.100.5"))).status, 404);
    assert.equal(calls, 2);
  } finally {
    Object.assign(process.env, { NODE_ENV: originalMode });
  }
});
