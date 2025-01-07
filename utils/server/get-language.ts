import { cookies } from "next/headers";

type Locale = "en" | "zh";

export async function getLanguageFromCookies(): Promise<Locale> {
  const cookieHeader = await cookies();
  const lang = cookieHeader.get("language")?.value || "en";
  return lang === "zh" ? "zh" : "en";
}
