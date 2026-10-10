import { logger } from "@/utils/logger";
import { isViewsStoreConfigured } from "@/utils/server/views";

type EnvironmentCheck = {
  name: string;
  ok: boolean;
  optional: boolean;
  message: string;
};

const globalForEnvWarnings = globalThis as typeof globalThis & {
  __envWarningKeys?: Set<string>;
  __envWarningsBootstrapped?: boolean;
};

function warnOnce(key: string, message: string, level: "info" | "warn" = "warn") {
  if (!globalForEnvWarnings.__envWarningKeys) {
    globalForEnvWarnings.__envWarningKeys = new Set();
  }

  if (globalForEnvWarnings.__envWarningKeys.has(key)) {
    return;
  }

  globalForEnvWarnings.__envWarningKeys.add(key);
  logger[level](message);
}

export function getEnvironmentChecks(): EnvironmentCheck[] {
  const hasRedisCredentials = isViewsStoreConfigured();
  const hasGeoKey = Boolean(process.env.GEO_IP_API_KEY?.trim());

  return [
    {
      name: "redis",
      ok: hasRedisCredentials || process.env.NODE_ENV !== "production",
      optional: true,
      message: hasRedisCredentials
        ? "Upstash Redis credentials are configured."
        : process.env.NODE_ENV === "production"
          ? "UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN are missing. View counts are disabled."
          : "Upstash Redis credentials are missing in development. View counts are kept in memory.",
    },
    {
      name: "geo",
      ok: hasGeoKey,
      optional: true,
      message: hasGeoKey
        ? "GEO_IP_API_KEY is configured."
        : "GEO_IP_API_KEY is missing. /api/geo will stay disabled until a key is provided.",
    },
  ];
}

export function ensureEnvironmentWarnings() {
  if (globalForEnvWarnings.__envWarningsBootstrapped) {
    return;
  }

  for (const check of getEnvironmentChecks()) {
    if (!check.ok) {
      warnOnce(`env:${check.name}`, `[env] ${check.message}`, check.optional ? "info" : "warn");
    }
  }

  globalForEnvWarnings.__envWarningsBootstrapped = true;
}
