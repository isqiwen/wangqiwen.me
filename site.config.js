/**
 * Central place for site- and author-specific information.
 *
 * This site now ships as an English-only blog. Update the identity, links,
 * avatar paths, and About copy below to rebrand it for another person or team.
 */
const siteConfig = {
  site: {
    language: "en",
    name: "Wang Qiwen",
    title: "Wang Qiwen's Blog",
    domain: "wangqiwen.me",
    url: "https://wangqiwen.me",
    description:
      "An English-language personal blog about software engineering, experiments, and writing.",
  },
  author: {
    name: "Wang Qiwen",
    tagline: "Software engineer, writer, and product builder.",
    location: "Shanghai, China",
    email: "isqiwen@gmail.com",
    images: {
      avatar: "/images/avatar-placeholder.svg",
      avatarMuted: "/images/avatar-placeholder-muted.svg",
    },
  },
  social: {
    primary: {
      label: "X",
      handle: "QiWenWang1",
      url: "https://twitter.com/QiWenWang1",
    },
    github: {
      label: "GitHub",
      url: "https://github.com/isqiwen/wangqiwen.me",
    },
  },
  project: {
    sourceUrl: "https://github.com/isqiwen/wangqiwen.me",
  },
  navigation: {
    headerLinks: [
      {
        href: "/about",
        label: "About",
      },
    ],
    followLabel: "Follow",
  },
  home: {
    eyebrow: "Personal Site",
    title: "Notes on software, systems, and writing",
    description:
      "A configurable English-language blog for essays, implementation notes, and product experiments.",
    primaryAction: {
      href: "/about",
      label: "About",
    },
    secondaryAction: {
      href: "https://twitter.com/QiWenWang1",
      label: "Follow",
    },
  },
  feed: {
    subtitle: "Essays",
  },
  footer: {
    sourceLabel: "Source",
    note: "Built for writing, publishing, and ongoing experiments.",
  },
  about: {
    title: "About",
    description: "Who I am, what I focus on, and what this site is designed to hold over time.",
    intro: [
      "I work across software engineering, product implementation, and writing, with a long-term interest in the craft of the web.",
      "This site is both a public blog and a durable working notebook. It is where I turn experiments, implementation details, and product lessons into something worth keeping.",
    ],
    sections: [
      {
        title: "What I focus on",
        items: [
          "Iterating on web products, frontend architecture, and content-driven experiences.",
          "Turning rough ideas into systems that are publishable, reusable, and maintainable.",
          "Exploring the overlap between writing workflows, design expression, and developer productivity.",
        ],
      },
      {
        title: "What this site is for",
        items: [
          "Publishing posts through one shared content system.",
          "Experimenting with richer MDX components so articles can carry more than plain text.",
          "Keeping writing, preview, publishing, and asset uploads in one practical author workflow.",
        ],
      },
      {
        title: "How I like to work",
        items: [
          "Understand the real constraints before introducing abstractions.",
          "Prefer simple implementations that survive maintenance over clever one-off tricks.",
          "Keep interface, copy, and code aligned under the same product judgment.",
        ],
      },
    ],
    contact: "If you'd like to talk about projects, writing, or implementation details, the easiest way to reach me is through X or GitHub.",
  },
  opengraph: {
    profileHighlights: [
      "Software engineer and product builder",
      "Writing about the web, tools, and experiments",
      "Based in Shanghai, China",
    ],
  },
};

module.exports = siteConfig;
module.exports.siteConfig = siteConfig;
