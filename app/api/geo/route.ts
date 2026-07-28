import { NextResponse } from "next/server";
import { isIP } from "net";

const API_URL = "https://api.ipgeolocation.io/ipgeo";

export async function GET(req: Request) {
  const ipHeader = req.headers.get("x-forwarded-for");
  const forwardedIp = ipHeader?.split(",")[0]?.trim() ?? "";
  const realIp = req.headers.get("x-real-ip")?.trim() ?? "";
  const ip = isIP(forwardedIp) ? forwardedIp : isIP(realIp) ? realIp : "";
  const apiKey = process.env.GEO_IP_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      {
        error: {
          message: "GEO_IP_API_KEY is not configured.",
          code: "MISSING_API_KEY",
        },
      },
      { status: 503 }
    );
  }

  if (!ip) {
    return NextResponse.json(
      {
        error: {
          message: "Unable to determine the client IP address.",
          code: "MISSING_CLIENT_IP",
        },
      },
      { status: 400 },
    );
  }

  try {
    const query = new URLSearchParams({ apiKey, ip });
    const res = await fetch(`${API_URL}?${query}`, {
      signal: AbortSignal.timeout(5000),
      cache: "no-store",
    });

    if (!res.ok) {
      return NextResponse.json(
        {
          error: {
            message: "Geo IP provider responded with an error.",
            code: "UPSTREAM_ERROR",
          },
        },
        { status: 502 }
      );
    }

    const geo = await res.json();

    return NextResponse.json({ country: geo.country_code2 ?? null });
  } catch (error) {
    return NextResponse.json(
      {
        error: {
          message: "Unable to retrieve geolocation data.",
          code: "REQUEST_FAILED",
        },
      },
      { status: 502 }
    );
  }
}
