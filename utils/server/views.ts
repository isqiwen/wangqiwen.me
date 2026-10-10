import type { Redis } from "@upstash/redis";
import { logger } from "@/utils/logger";
import {
  getUpstash,
  isUpstashConfigured,
  withTimeout,
} from "@/utils/server/upstash";

// View counts are the only state that changes without a deployment. They are
// optional: pages never wait for them, and every function here answers `null`
// when the store is missing, slow or failing, so callers can omit the number.

const VIEWS_KEY = "views";

type ViewsStore = {
  read(ids: string[]): Promise<Record<string, number>>;
  increment(id: string): Promise<number>;
};

export type ViewsStoreStatus = "ok" | "disabled" | "unavailable";

const globalForViews = globalThis as typeof globalThis & {
  __viewsStore?: ViewsStore | null;
};

export function isViewsStoreConfigured(): boolean {
  return isUpstashConfigured();
}

export async function readViews(
  ids: string[]
): Promise<Record<string, number> | null> {
  const store = getStore();
  if (!store) {
    return null;
  }

  if (ids.length === 0) {
    return {};
  }

  try {
    return await withTimeout(store.read(ids));
  } catch (error) {
    logger.warn("[views] Could not read view counts.", error);
    return null;
  }
}

export async function incrementViews(id: string): Promise<number | null> {
  const store = getStore();
  if (!store) {
    return null;
  }

  try {
    return await withTimeout(store.increment(id));
  } catch (error) {
    logger.warn("[views] Could not record a view.", error);
    return null;
  }
}

export async function getViewsStoreStatus(): Promise<ViewsStoreStatus> {
  const store = getStore();
  if (!store) {
    return "disabled";
  }

  try {
    await withTimeout(store.read(["__healthcheck__"]));
    return "ok";
  } catch {
    return "unavailable";
  }
}

function getStore(): ViewsStore | null {
  if (globalForViews.__viewsStore === undefined) {
    globalForViews.__viewsStore = createStore();
  }

  return globalForViews.__viewsStore;
}

function createStore(): ViewsStore | null {
  const upstash = getUpstash();
  if (upstash) {
    return createUpstashStore(upstash);
  }

  // Local work counts in memory. A deployment without a store has no counts.
  return process.env.NODE_ENV === "production" ? null : createMemoryStore();
}

function createUpstashStore(redis: Redis): ViewsStore {
  return {
    async read(ids) {
      const values =
        (await redis.hmget<Record<string, unknown>>(VIEWS_KEY, ...ids)) ?? {};
      return toCounts(ids, id => values[id]);
    },
    async increment(id) {
      return Number(await redis.hincrby(VIEWS_KEY, id, 1));
    },
  };
}

function createMemoryStore(): ViewsStore {
  const counts = new Map<string, number>();

  return {
    async read(ids) {
      return toCounts(ids, id => counts.get(id));
    },
    async increment(id) {
      const next = (counts.get(id) ?? 0) + 1;
      counts.set(id, next);
      return next;
    },
  };
}

function toCounts(
  ids: string[],
  lookup: (id: string) => unknown
): Record<string, number> {
  return Object.fromEntries(ids.map(id => [id, Number(lookup(id) ?? 0)]));
}
