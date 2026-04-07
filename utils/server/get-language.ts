import { cookies } from "next/headers";
import { languageCookieName, type Locale, resolveLocale } from "@/locales/config";

export async function getLanguageFromCookies(): Promise<Locale> {
  const cookieHeader = await cookies();
  return resolveLocale(cookieHeader.get(languageCookieName)?.value);
}
