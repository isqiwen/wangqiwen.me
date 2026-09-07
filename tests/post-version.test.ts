import assert from "node:assert/strict";
import test from "node:test";
import { assertPostPrecondition, getPostVersion, PostPreconditionError } from "../utils/server/post-version";

const original = "Original article\n";
const version = getPostVersion(original);
const errorStatus = (status: number) => (error: unknown) =>
  error instanceof PostPreconditionError && error.status === status;

test("file versions are stable strong validators sensitive to exact content", () => {
  assert.match(version, /^"sha256-[a-f0-9]{64}"$/);
  assert.equal(version, getPostVersion(original));
  assert.notEqual(version, getPostVersion("Original article\r\n"));
  assert.notEqual(getPostVersion("草稿甲"), getPostVersion("草稿乙"));
});

test("matching versions allow updates and deletes", () => {
  assert.doesNotThrow(() => assertPostPrecondition(original, new Headers({ "If-Match": version }), false));
});

test("stale and missing files fail without permitting a write", () => {
  for (const current of ["New article\n", null]) {
    assert.throws(() => assertPostPrecondition(current, new Headers({ "If-Match": version }), false), errorStatus(412));
  }
});

test("existing files require a version rather than last-writer-wins fallback", () => {
  assert.throws(() => assertPostPrecondition(original, new Headers(), false), errorStatus(428));
});

test("weak, wildcard, malformed, list and conflicting validators cannot bypass the check", () => {
  for (const value of ["*", `W/${version}`, "invalid", `${version}, ${version}`]) {
    assert.throws(() => assertPostPrecondition(original, new Headers({ "If-Match": value }), false), errorStatus(400));
  }
  assert.throws(() => assertPostPrecondition(original, new Headers({ "If-Match": version, "If-None-Match": "*" }), false), errorStatus(400));
});

test("create-only requests require explicit preconditions and never replace a file", () => {
  const headers = new Headers({ "If-None-Match": "*" });
  assert.doesNotThrow(() => assertPostPrecondition(null, headers, true));
  assert.throws(() => assertPostPrecondition(original, headers, true), errorStatus(412));
  assert.throws(() => assertPostPrecondition(null, new Headers(), true), errorStatus(428));
  assert.throws(() => assertPostPrecondition(null, new Headers({ "If-None-Match": version }), true), errorStatus(400));
});
