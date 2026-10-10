import { NextResponse } from "next/server";
import { getEnvironmentChecks } from "@/utils/server/env-warnings";
import { getViewsStoreStatus } from "@/utils/server/views";

export const dynamic = "force-dynamic";

// Answers 200 whenever the application can serve pages, which is what a
// deployment and an uptime monitor need to know. View counts are optional:
// `status` is "degraded" when their store is configured but unreachable, and
// pages are still served without the numbers.
export async function GET() {
  const views = await getViewsStoreStatus();

  return NextResponse.json(
    {
      status: views === "unavailable" ? "degraded" : "ok",
      views,
      timestamp: new Date().toISOString(),
      ...(process.env.NODE_ENV === "production"
        ? {}
        : { checks: getEnvironmentChecks() }),
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}
