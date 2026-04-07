export const supportedLocales = ["en", "zh"] as const;

export type Locale = (typeof supportedLocales)[number];

export const defaultLocale: Locale = "en";
export const languageCookieName = "language";

export function isSupportedLocale(value: string | null | undefined): value is Locale {
  return supportedLocales.includes(value as Locale);
}

export function resolveLocale(value: string | null | undefined): Locale {
  return isSupportedLocale(value) ? value : defaultLocale;
}
