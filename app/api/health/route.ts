import { NextResponse } from "next/server";
import redis from "@/app/redis";
import { getEnvironmentChecks } from "@/utils/server/env-warnings";

export const dynamic = "force-dynamic";

export async function GET() {
  const environment = getEnvironmentChecks();
  let redisReachable = true;

  try {
    await redis.get("__healthcheck__");
  } catch {
    redisReachable = false;
  }

  const checks = [
    ...environment,
    {
      name: "redis-runtime",
      ok: redisReachable,
      optional: false,
      message: redisReachable
        ? "Redis adapter responded to a lightweight check."
        : "Redis adapter did not respond to the health probe.",
    },
  ];

  const hasRequiredFailure = checks.some(check => !check.optional && !check.ok);

  return NextResponse.json(
    {
      status: hasRequiredFailure ? "degraded" : "ok",
      timestamp: new Date().toISOString(),
      checks,
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
      status: hasRequiredFailure ? 503 : 200,
    },
  );
}
