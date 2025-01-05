import { cookies } from "next/headers";
import { Theme } from "@/themes/enum";

export const getPreferredTheme = async () => {
  const cookieHeader = await cookies();
  const preferredThemeCookies = (cookieHeader.get("preferred_theme")?.value ?? Theme.Auto) as Theme;

  if (!Object.values(Theme).includes(preferredThemeCookies)) {
    return Theme.Auto;
  }

  return preferredThemeCookies;
};

export default async function getTheme() {
  const cookieHeader = await cookies();
  const themeCookies = (cookieHeader.get("theme")?.value ?? Theme.Light) as Theme;

  if (themeCookies !== Theme.Light && themeCookies !== Theme.Dark) {
    return Theme.Light;
  }

  return themeCookies;
}
