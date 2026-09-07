import assert from "node:assert/strict";
import { test } from "node:test";
import { getEditorRequestError } from "../utils/shared/editor-access.js";

function request(method = "GET", headers: Record<string, string> = {}) {
  return new Request("http://127.0.0.1:3000/api/editor", { method, headers });
}

test("allows loopback reads without an Origin header", () => {
  assert.equal(getEditorRequestError(request()), null);
  for (const host of ["localhost:3000", "127.0.0.1:3000", "[::1]:3000"]) {
    assert.equal(getEditorRequestError(request("GET", { host })), null);
  }
});

test("allows same-origin editor mutations", () => {
  for (const method of ["POST", "DELETE", "PUT", "PATCH"]) {
    assert.equal(getEditorRequestError(request(method, { origin: "http://127.0.0.1:3000" })), null);
  }
});

test("rejects a missing Origin on mutations", () => {
  assert.match(getEditorRequestError(request("POST")) ?? "", /same-origin/);
  assert.match(getEditorRequestError(request("DELETE")) ?? "", /same-origin/);
});

test("rejects non-loopback and misleading Host headers", () => {
  for (const host of [
    "192.168.50.10:3000", "0.0.0.0:3000", "example.com", "localhost.example.com",
    "localhost@evil.example", "localhost:3000/path", "localhost.",
  ]) {
    assert.match(getEditorRequestError(request("GET", { host })) ?? "", /loopback/);
  }
});

test("rejects different ports, schemes, hosts and malformed origins", () => {
  for (const origin of [
    "http://example.com", "http://127.0.0.1:4000", "https://127.0.0.1:3000",
    "http://localhost:3000", "null", "not-a-url", "http://127.0.0.1:3000/path",
    "http://user@127.0.0.1:3000",
  ]) {
    assert.notEqual(getEditorRequestError(request("POST", { origin })), null);
  }
});

test("rejects cross-site reads as well as writes", () => {
  for (const method of ["GET", "POST"]) {
    assert.match(getEditorRequestError(request(method, {
      origin: "http://127.0.0.1:3000", "sec-fetch-site": "cross-site",
    })) ?? "", /Cross-site/);
  }
});

test("does not trust forwarded headers to authorize a remote Host", () => {
  assert.match(getEditorRequestError(request("POST", {
    host: "remote.example", origin: "http://127.0.0.1:3000",
    "x-forwarded-host": "127.0.0.1:3000", "x-forwarded-for": "127.0.0.1",
  })) ?? "", /loopback/);
});
