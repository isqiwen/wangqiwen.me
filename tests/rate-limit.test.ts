import assert from "node:assert/strict";
import test from "node:test";
import { randomUUID } from "node:crypto";
import {
  consumeRateLimitToken,
  getRequestClientIp,
} from "@/utils/server/rate-limit";

test("uses the first valid forwarded client IP", () => {
  const request = new Request("http://localhost", {
    headers: {
      "x-forwarded-for": "203.0.113.5, 10.0.0.1",
      "x-real-ip": "198.51.100.1",
    },
  });

  assert.equal(getRequestClientIp(request), "203.0.113.5");
});

test("enforces the configured request limit", () => {
  const key = `test:${randomUUID()}`;
  const options = { limit: 2, windowMs: 60_000 };

  assert.deepEqual(consumeRateLimitToken(key, options), {
    allowed: true,
    remaining: 1,
    retryAfterSeconds: 60,
  });
  assert.equal(consumeRateLimitToken(key, options).allowed, true);

  const rejected = consumeRateLimitToken(key, options);
  assert.equal(rejected.allowed, false);
  assert.equal(rejected.remaining, 0);
  assert.ok(rejected.retryAfterSeconds >= 1);
});
