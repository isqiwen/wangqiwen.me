import rawSiteConfig from "@/site.config";

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

type Link = {
  href: string;
  label: string;
};

export type SiteConfig = {
  site: {
    language: string;
    name: string;
    title: string;
    domain: string;
    url: string;
    description: string;
  };
  author: {
    name: string;
    tagline: string;
    location: string;
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
    headerLinks: Link[];
    followLabel: string;
  };
  home: {
    eyebrow: string;
    title: string;
    description: string;
    primaryAction: Link;
    secondaryAction?: Link | null;
  };
  feed: {
    subtitle: string;
  };
  footer: {
    sourceLabel: string;
    note: string;
    icpRegistration?: {
      label: string;
      url: string;
    } | null;
  };
  about: AboutContent;
  opengraph: {
    profileHighlights: string[];
  };
};

export const siteConfig = rawSiteConfig as SiteConfig;

export function getAuthorName(): string {
  return siteConfig.author.name;
}

export function getAuthorTagline(): string {
  return siteConfig.author.tagline;
}

export function getAuthorLocation(): string {
  return siteConfig.author.location;
}

export function getAboutContent(): AboutContent {
  return siteConfig.about;
}

export function getProfileHighlights(): string[] {
  return siteConfig.opengraph.profileHighlights;
}

export function getPrimarySocialHandle(): string {
  return siteConfig.social.primary.handle
    ? `@${siteConfig.social.primary.handle}`
    : siteConfig.social.primary.label;
}

export function getNavigationLinks() {
  return siteConfig.navigation.headerLinks.map(item => ({
    href: item.href,
    label: item.label,
  }));
}

export function getFollowLabel(): string {
  return siteConfig.navigation.followLabel;
}

export function getHomeContent() {
  const secondaryAction = siteConfig.home.secondaryAction
    ? {
        href: siteConfig.home.secondaryAction.href,
        label: siteConfig.home.secondaryAction.label,
      }
    : null;

  return {
    eyebrow: siteConfig.home.eyebrow,
    title: siteConfig.home.title,
    description: siteConfig.home.description,
    primaryAction: {
      href: siteConfig.home.primaryAction.href,
      label: siteConfig.home.primaryAction.label,
    },
    secondaryAction,
  };
}

export function getFooterContent() {
  return {
    sourceLabel: siteConfig.footer.sourceLabel,
    note: siteConfig.footer.note,
    icpRegistration: siteConfig.footer.icpRegistration
      ? {
          label: siteConfig.footer.icpRegistration.label,
          url: siteConfig.footer.icpRegistration.url,
        }
      : null,
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
