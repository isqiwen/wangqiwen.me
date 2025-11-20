"use client";

import { usePathname, useRouter } from "next/navigation";
import Cookies from "js-cookie";
import useDictionary from "@/locales/dictionary-hook";

type Locale = "en" | "zh";
const DEFAULT_LOCALE_ORDER: Locale[] = ["zh", "en"];

const TRANSLATION_DATA: Record<string, Partial<Record<Locale, string>>> = (() => {
  try {
    return JSON.parse(process.env.NEXT_PUBLIC_POST_TRANSLATIONS ?? "{}");
  } catch {
    return {};
  }
})();

const POST_TRANSLATIONS_BY_PATH = buildPathToTranslationMap(TRANSLATION_DATA);

interface LanguageSwitcherProps {
  currentLanguage: Locale;
}

export function LanguageSwitcher({ currentLanguage }: LanguageSwitcherProps) {
  const pathname = usePathname();
  const router = useRouter();
  const dict = useDictionary();
  const normalizedPath = normalizePath(pathname);
  const articleMatch = normalizedPath.match(/^\/((zh|en)\/)?\d{4}\//);
  const hasLocalePrefix = Boolean(articleMatch && articleMatch[2]);
  const isArticleRoute = Boolean(articleMatch);
  const translationEntry = hasLocalePrefix
    ? POST_TRANSLATIONS_BY_PATH.get(normalizedPath)
    : undefined;

  const availableLocales = translationEntry
    ? getAvailableLocales(translationEntry)
    : isArticleRoute
      ? [currentLanguage]
      : DEFAULT_LOCALE_ORDER;

  const targetLanguage = translationEntry
    ? getNextLocale(currentLanguage, availableLocales)
    : isArticleRoute
      ? currentLanguage
      : getNextLocale(currentLanguage, DEFAULT_LOCALE_ORDER);

  const isDisabled = translationEntry ? availableLocales.length <= 1 : isArticleRoute;
  const labelMap: Record<Locale, string> = {
    zh: dict.language?.chinese ?? "中文",
    en: dict.language?.english ?? "English",
  };

  const toggleLanguage = () => {
    if (isDisabled) return;

    const newLanguage = targetLanguage ?? currentLanguage;

    if (translationEntry) {
      const targetPath = translationEntry[newLanguage];
      if (!targetPath) {
        return;
      }

      Cookies.set("language", newLanguage);
      router.push(targetPath);
      router.refresh();
      return;
    }

    Cookies.set("language", newLanguage);

    if (pathname === "/") {
      router.refresh();
    } else if (pathname.startsWith("/about/zh") || pathname.startsWith("/about/en")) {
      const newPath = pathname.replace(/^\/about\/(zh|en)/, `/about/${newLanguage}`);
      router.push(newPath);
      router.refresh();
    } else if (pathname.startsWith("/zh") || pathname.startsWith("/en")) {
      const updatedPath = pathname.replace(/^\/(zh|en)/, `/${newLanguage}`);
      router.push(updatedPath);
      router.refresh();
    } else if (isArticleRoute) {
      // article route without locale prefix: do not attempt to switch
      router.refresh();
    } else {
      router.refresh();
    }
  };

  return (
    <button
      onClick={toggleLanguage}
      disabled={isDisabled}
      className="inline-flex hover:bg-gray-200 dark:hover:bg-[#313131] active:bg-gray-300 dark:active:bg-[#242424] rounded-sm p-2 transition-[background-color] disabled:opacity-50"
    >
      {labelMap[targetLanguage ?? currentLanguage] ?? targetLanguage}
    </button>
  );
}

function buildPathToTranslationMap(
  translations: Record<string, Partial<Record<Locale, string>>>,
) {
  const map = new Map<string, Partial<Record<Locale, string>>>();
  for (const locales of Object.values(translations)) {
    if (!locales) continue;
    for (const locale of ["zh", "en"] as Locale[]) {
      const path = locales[locale];
      if (typeof path === "string") {
        map.set(normalizePath(path), locales);
      }
    }
  }
  return map;
}

function getAvailableLocales(locales: Partial<Record<Locale, string>>): Locale[] {
  const available = DEFAULT_LOCALE_ORDER.filter(locale => Boolean(locales[locale]));
  return available.length > 0 ? available : DEFAULT_LOCALE_ORDER;
}

function getNextLocale(current: Locale, available: Locale[]): Locale {
  const index = available.indexOf(current);
  if (index === -1) {
    return available[0];
  }
  return available[(index + 1) % available.length];
}

function normalizePath(path: string | null): string {
  if (!path) return "/";
  if (path === "/") return "/";
  return path.replace(/\/+$/, "");
}
