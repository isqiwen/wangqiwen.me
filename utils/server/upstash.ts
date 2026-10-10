import { Redis } from "@upstash/redis";

const REQUEST_TIMEOUT_MS = 2000;

const globalForUpstash = globalThis as typeof globalThis & {
  __upstash?: Redis | null;
};

export function isUpstashConfigured(): boolean {
  return (
    Boolean(process.env.UPSTASH_REDIS_REST_URL) &&
    Boolean(process.env.UPSTASH_REDIS_REST_TOKEN)
  );
}

// The remote store, or null when there is none to use. Local work never
// touches it unless UPSTASH_REDIS_FORCE_REMOTE=1, so authoring cannot change
// production data.
export function getUpstash(): Redis | null {
  if (globalForUpstash.__upstash === undefined) {
    const useRemote =
      isUpstashConfigured() &&
      (process.env.NODE_ENV === "production" ||
        process.env.UPSTASH_REDIS_FORCE_REMOTE === "1");

    globalForUpstash.__upstash = useRemote
      ? new Redis({
          url: process.env.UPSTASH_REDIS_REST_URL!,
          token: process.env.UPSTASH_REDIS_REST_TOKEN!,
          // The client's default is five attempts with exponential backoff.
          // Nothing kept here is worth holding a response for that long.
          retry: { retries: 1, backoff: () => 100 },
        })
      : null;
  }

  return globalForUpstash.__upstash;
}

// Bounds one store call. The client has no request timeout of its own.
export function withTimeout<T>(operation: Promise<T>): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(
      () => reject(new Error(`Timed out after ${REQUEST_TIMEOUT_MS} ms`)),
      REQUEST_TIMEOUT_MS
    );
  });

  return Promise.race([operation, timeout]).finally(() => clearTimeout(timer));
}
