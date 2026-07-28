import { isIP } from "net";

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

type RateLimitResult = {
  allowed: boolean;
  retryAfterSeconds: number;
  remaining: number;
};

const globalForRateLimit = globalThis as typeof globalThis & {
  __rateLimitStore?: Map<string, RateLimitEntry>;
  __rateLimitOperations?: number;
};

function getStore() {
  if (!globalForRateLimit.__rateLimitStore) {
    globalForRateLimit.__rateLimitStore = new Map();
  }

  globalForRateLimit.__rateLimitOperations =
    (globalForRateLimit.__rateLimitOperations ?? 0) + 1;
  if (globalForRateLimit.__rateLimitOperations % 128 === 0) {
    pruneExpiredEntries(globalForRateLimit.__rateLimitStore);
  }

  return globalForRateLimit.__rateLimitStore;
}

function pruneExpiredEntries(store: Map<string, RateLimitEntry>) {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (entry.resetAt <= now) {
      store.delete(key);
    }
  }

  const maximumEntries = 10_000;
  while (store.size > maximumEntries) {
    const oldestKey = store.keys().next().value;
    if (typeof oldestKey !== "string") {
      break;
    }
    store.delete(oldestKey);
  }
}

export function getRequestClientIp(request: Request): string {
  const forwardedIp =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "";
  if (isIP(forwardedIp)) {
    return forwardedIp;
  }

  const realIp = request.headers.get("x-real-ip")?.trim() ?? "";
  return isIP(realIp) ? realIp : "unknown";
}

export function consumeRateLimitToken(
  key: string,
  options: { limit: number; windowMs: number },
): RateLimitResult {
  const store = getStore();
  const now = Date.now();
  const existing = store.get(key);

  if (!existing || existing.resetAt <= now) {
    store.set(key, {
      count: 1,
      resetAt: now + options.windowMs,
    });

    return {
      allowed: true,
      retryAfterSeconds: Math.ceil(options.windowMs / 1000),
      remaining: Math.max(0, options.limit - 1),
    };
  }

  if (existing.count >= options.limit) {
    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
      remaining: 0,
    };
  }

  existing.count += 1;
  store.set(key, existing);

  return {
    allowed: true,
    retryAfterSeconds: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
    remaining: Math.max(0, options.limit - existing.count),
  };
}
