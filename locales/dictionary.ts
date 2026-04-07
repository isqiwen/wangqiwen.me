import "server-only";

import { cookies } from "next/headers";
import {
  defaultLocale,
  languageCookieName,
  resolveLocale,
  type Locale,
} from "@/locales/config";

const dictionaries = {
  en: () => import("./en/lang.json").then(module => module.default),
  zh: () => import("./zh/lang.json").then(module => module.default),
};

export const getLocales = () => Object.keys(dictionaries) as Array<Locale>;

export const getLocale = async (): Promise<Locale> => {
  const cookieHeader = await cookies();
  const locale = resolveLocale(cookieHeader.get(languageCookieName)?.value);
  return getLocales().includes(locale) ? locale : defaultLocale;
};

export const getDictionary = async () => {
  const locale = await getLocale();
  return dictionaries[locale]();
};
