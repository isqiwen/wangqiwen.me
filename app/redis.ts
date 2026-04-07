import { Redis } from "@upstash/redis";
import { logger } from "@/utils/logger";

type RedisLike = {
  hgetall: (key: string) => Promise<Record<string, string> | null>;
  hget: (key: string, field: string) => Promise<string | null>;
  hincrby: (key: string, field: string, increment: number) => Promise<number>;
  set: (key: string, value: unknown) => Promise<unknown>;
  get: (key: string) => Promise<unknown | null>;
};

const globalForRedisWarnings = globalThis as typeof globalThis & {
  __redisMockWarningShown?: boolean;
};

const hasRedisCredentials =
  Boolean(process.env.UPSTASH_REDIS_REST_URL) &&
  Boolean(process.env.UPSTASH_REDIS_REST_TOKEN);

const preferMockInDev =
  process.env.NODE_ENV !== "production" &&
  process.env.UPSTASH_REDIS_FORCE_REMOTE !== "1";
const shouldUseMock = !hasRedisCredentials || preferMockInDev;

const redis: RedisLike = shouldUseMock ? createMockRedis() : (Redis.fromEnv() as RedisLike);

if (shouldUseMock) {
  const message = !hasRedisCredentials
    ? process.env.NODE_ENV === "production"
      ? "Upstash Redis credentials are missing. Falling back to an in-memory mock so builds and runtime rendering can still complete."
      : "Upstash Redis credentials not found. Using in-memory mock for development."
    : "Using in-memory Redis mock in development. Set UPSTASH_REDIS_FORCE_REMOTE=1 to hit Upstash.";

  if (!globalForRedisWarnings.__redisMockWarningShown) {
    logger.warn(message);
    globalForRedisWarnings.__redisMockWarningShown = true;
  }
}

export default redis;

function createMockRedis(): RedisLike {
  const kvStore = new Map<string, unknown>();
  const hashStore = new Map<string, Map<string, string>>();

  const ensureHash = (key: string) => {
    if (!hashStore.has(key)) {
      hashStore.set(key, new Map());
    }
    return hashStore.get(key)!;
  };

  return {
    async hgetall(key) {
      const map = hashStore.get(key);
      if (!map || map.size === 0) return {};
      return Object.fromEntries(map.entries());
    },
    async hget(key, field) {
      return hashStore.get(key)?.get(field) ?? null;
    },
    async hincrby(key, field, increment) {
      const map = ensureHash(key);
      const current = Number(map.get(field) ?? 0);
      const next = current + increment;
      map.set(field, String(next));
      return next;
    },
    async set(key, value) {
      kvStore.set(key, value ?? null);
    },
    async get(key) {
      if (!kvStore.has(key)) {
        return null;
      }
      return kvStore.get(key) ?? null;
    },
  };
}
