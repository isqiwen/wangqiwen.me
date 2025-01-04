import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const ip = req.headers.get("x-forwarded-for") || "8.8.8.8";
  const res = await fetch(
  `https://api.ipgeolocation.io/ipgeo?apiKey=YOUR_API_KEY&ip=${ip}`
  );
  const geo = await res.json();

  return NextResponse.json({ country: geo.country_code2 });
}
