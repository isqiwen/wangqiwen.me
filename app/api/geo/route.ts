import { NextResponse } from "next/server";

const API_URL = "https://api.ipgeolocation.io/ipgeo";

export async function GET(req: Request) {
  const ipHeader = req.headers.get("x-forwarded-for");
  const ip = ipHeader?.split(",")[0]?.trim() || "8.8.8.8";
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

  try {
    const res = await fetch(`${API_URL}?apiKey=${apiKey}&ip=${ip}`);

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
