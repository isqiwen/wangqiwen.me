import assert from "node:assert/strict";
import test from "node:test";
import { buildDiffRows, buildSplitDiffRows } from "../utils/line-diff";

test("builds a unified line diff with old and new line numbers", () => {
  assert.deepEqual(buildDiffRows("alpha\nbeta\ngamma", "alpha\ndelta\ngamma"), [
    { kind: "context", beforeLine: 1, afterLine: 1, content: "alpha" },
    { kind: "removed", beforeLine: 2, afterLine: null, content: "beta" },
    { kind: "added", beforeLine: null, afterLine: 2, content: "delta" },
    { kind: "context", beforeLine: 3, afterLine: 3, content: "gamma" },
  ]);
});

test("collapses unchanged context outside the requested review window", () => {
  assert.deepEqual(
    buildDiffRows("one\ntwo\nthree\nfour\nfive\nsix\nseven", "one\ntwo\nTHREE\nfour\nfive\nsix\nseven", 1),
    [
      { kind: "collapsed", count: 1 },
      { kind: "context", beforeLine: 2, afterLine: 2, content: "two" },
      { kind: "removed", beforeLine: 3, afterLine: null, content: "three" },
      { kind: "added", beforeLine: null, afterLine: 3, content: "THREE" },
      { kind: "context", beforeLine: 4, afterLine: 4, content: "four" },
      { kind: "collapsed", count: 3 },
    ],
  );
});

test("aligns removed and added lines in a parallel review row", () => {
  assert.deepEqual(buildSplitDiffRows("alpha\nbeta\ngamma", "alpha\ndelta\ngamma"), [
    {
      kind: "split",
      before: { kind: "context", beforeLine: 1, afterLine: 1, content: "alpha" },
      after: { kind: "context", beforeLine: 1, afterLine: 1, content: "alpha" },
    },
    {
      kind: "split",
      before: { kind: "removed", beforeLine: 2, afterLine: null, content: "beta" },
      after: { kind: "added", beforeLine: null, afterLine: 2, content: "delta" },
    },
    {
      kind: "split",
      before: { kind: "context", beforeLine: 3, afterLine: 3, content: "gamma" },
      after: { kind: "context", beforeLine: 3, afterLine: 3, content: "gamma" },
    },
  ]);
});
