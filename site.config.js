/**
 * Central place for site- and author-specific information.
 *
 * If you want to rebrand this blog for another person or team, start here:
 * update the identity, social links, avatar paths, and about-page copy below.
 * The app shell, metadata, Open Graph images, feeds, and About page all read
 * from this file so the branding stays consistent.
 */
const siteConfig = {
  site: {
    name: "Wang Qiwen",
    title: "Wang Qiwen's Blog",
    domain: "wangqiwen.me",
    url: "https://wangqiwen.me",
    description:
      "A multilingual personal blog about software engineering, experiments, and writing.",
  },
  author: {
    name: {
      zh: "王琦文",
      en: "Wang Qiwen",
    },
    tagline: {
      zh: "软件工程师、写作者，也是一个喜欢把想法落成产品的人。",
      en: "Software engineer, writer, and product builder.",
    },
    location: {
      zh: "中国，上海",
      en: "Shanghai, China",
    },
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
        label: {
          zh: "About",
          en: "About",
        },
      },
    ],
    followLabel: {
      zh: "Follow",
      en: "Follow",
    },
  },
  home: {
    eyebrow: {
      zh: "Personal Site",
      en: "Personal Site",
    },
    title: {
      zh: "Notes on software, systems, and writing",
      en: "Notes on software, systems, and writing",
    },
    description: {
      zh: "A configurable bilingual blog for essays, implementation notes, and product experiments.",
      en: "A configurable bilingual blog for essays, implementation notes, and product experiments.",
    },
    primaryAction: {
      href: "/about",
      label: {
        zh: "About",
        en: "About",
      },
    },
    secondaryAction: {
      href: "https://twitter.com/QiWenWang1",
      label: {
        zh: "Follow",
        en: "Follow",
      },
    },
  },
  feed: {
    subtitle: "Essays",
  },
  footer: {
    sourceLabel: {
      zh: "Source",
      en: "Source",
    },
    note: {
      zh: "Built for writing, publishing, and ongoing experiments.",
      en: "Built for writing, publishing, and ongoing experiments.",
    },
  },
  about: {
    zh: {
      title: "关于",
      description: "关于我、我当前关注的方向，以及这个网站想长期承载什么内容。",
      intro: [
        "我主要做软件工程、产品实现和写作，长期关注 Web 体验、内容系统和工程细节。",
        "这个网站既是公开博客，也是长期维护的数字工作台。我会在这里记录思考、实验过程，以及那些值得沉淀下来的实现经验。",
      ],
      sections: [
        {
          title: "我在做什么",
          items: [
            "围绕 Web 产品、前端架构和内容体验做持续迭代。",
            "把零散想法整理成可发布、可复用、可维护的实现。",
            "关注写作流程、设计表达和开发效率之间的结合点。",
          ],
        },
        {
          title: "这个网站的定位",
          items: [
            "发布中英文文章，统一管理内容索引与站点元信息。",
            "实验更丰富的 MDX 组件，让内容不仅仅是文字。",
            "把写作、预览、发布和资源上传串成一条顺滑的作者工作流。",
          ],
        },
        {
          title: "我偏好的工作方式",
          items: [
            "先把系统边界和真实需求看清，再做抽象。",
            "优先做能长期维护的简单实现，而不是一次性的技巧堆叠。",
            "让界面、文案和代码实现尽量保持同一套判断标准。",
          ],
        },
      ],
      contact: "如果你想交流项目、写作或工程实现，最方便的方式是通过 X 或 GitHub 联系我。",
    },
    en: {
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
            "Publishing bilingual posts with one shared content system.",
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
  },
  opengraph: {
    profileHighlights: {
      zh: [
        "软件工程师与产品构建者",
        "持续记录 Web、工具与实验",
        "常驻中国上海",
      ],
      en: [
        "Software engineer and product builder",
        "Writing about the web, tools, and experiments",
        "Based in Shanghai, China",
      ],
    },
  },
};

module.exports = siteConfig;
module.exports.siteConfig = siteConfig;
