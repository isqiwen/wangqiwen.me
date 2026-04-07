import type { Locale } from "@/locales/config";
import rawSiteConfig from "@/site.config";

type LocalizedString = Record<Locale, string>;

type AboutSection = {
  title: string;
  items: string[];
};

type AboutContent = {
  title: string;
  description: string;
  intro: string[];
  sections: AboutSection[];
  contact: string;
};

type LocalizedLink = {
  href: string;
  label: LocalizedString;
};

export type SiteConfig = {
  site: {
    name: string;
    title: string;
    domain: string;
    url: string;
    description: string;
  };
  author: {
    name: LocalizedString;
    tagline: LocalizedString;
    location: LocalizedString;
    email: string;
    images: {
      avatar: string;
      avatarMuted: string;
    };
  };
  social: {
    primary: {
      label: string;
      handle: string;
      url: string;
    };
    github: {
      label: string;
      url: string;
    };
  };
  project: {
    sourceUrl: string;
  };
  navigation: {
    headerLinks: LocalizedLink[];
    followLabel: LocalizedString;
  };
  home: {
    eyebrow: LocalizedString;
    title: LocalizedString;
    description: LocalizedString;
    primaryAction: LocalizedLink;
    secondaryAction?: LocalizedLink | null;
  };
  feed: {
    subtitle: string;
  };
  footer: {
    sourceLabel: LocalizedString;
    note: LocalizedString;
  };
  about: Record<Locale, AboutContent>;
  opengraph: {
    profileHighlights: Record<Locale, string[]>;
  };
};

export const siteConfig = rawSiteConfig as SiteConfig;

export function getLocalizedString(value: LocalizedString, locale: Locale): string {
  return value[locale] ?? value.en ?? value.zh;
}

export function getAuthorName(locale: Locale): string {
  return getLocalizedString(siteConfig.author.name, locale);
}

export function getAuthorTagline(locale: Locale): string {
  return getLocalizedString(siteConfig.author.tagline, locale);
}

export function getAuthorLocation(locale: Locale): string {
  return getLocalizedString(siteConfig.author.location, locale);
}

export function getAboutContent(locale: Locale): AboutContent {
  return siteConfig.about[locale] ?? siteConfig.about.en;
}

export function getProfileHighlights(locale: Locale): string[] {
  return siteConfig.opengraph.profileHighlights[locale] ?? siteConfig.opengraph.profileHighlights.en;
}

export function getPrimarySocialHandle(): string {
  return siteConfig.social.primary.handle ? `@${siteConfig.social.primary.handle}` : siteConfig.social.primary.label;
}

export function getNavigationLinks(locale: Locale) {
  return siteConfig.navigation.headerLinks.map(item => ({
    href: item.href,
    label: getLocalizedString(item.label, locale),
  }));
}

export function getFollowLabel(locale: Locale): string {
  return getLocalizedString(siteConfig.navigation.followLabel, locale);
}

export function getHomeContent(locale: Locale) {
  const secondaryAction = siteConfig.home.secondaryAction
    ? {
        href: siteConfig.home.secondaryAction.href,
        label: getLocalizedString(siteConfig.home.secondaryAction.label, locale),
      }
    : null;

  return {
    eyebrow: getLocalizedString(siteConfig.home.eyebrow, locale),
    title: getLocalizedString(siteConfig.home.title, locale),
    description: getLocalizedString(siteConfig.home.description, locale),
    primaryAction: {
      href: siteConfig.home.primaryAction.href,
      label: getLocalizedString(siteConfig.home.primaryAction.label, locale),
    },
    secondaryAction,
  };
}

export function getFooterContent(locale: Locale) {
  return {
    sourceLabel: getLocalizedString(siteConfig.footer.sourceLabel, locale),
    note: getLocalizedString(siteConfig.footer.note, locale),
  };
}

export function getSiteUrl(path = "/"): string {
  return new URL(path, siteConfig.site.url).toString();
}

export function isAbsoluteUrl(value: string): boolean {
  return /^https?:\/\//i.test(value);
}

export function getPublicAssetPath(value: string): string {
  return value.replace(/^\/+/, "");
}
