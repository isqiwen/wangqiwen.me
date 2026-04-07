const { join } = require("path");
const { readFileSync } = require("fs");

const withMDX = require("@next/mdx")({
  options: {
    remarkPlugins: [require.resolve("./utils/remark/remove-frontmatter")],
  },
});

const POST_TRANSLATIONS = loadPostTranslations();

module.exports = withMDX({
  pageExtensions: ["ts", "tsx", "js", "jsx", "md", "mdx"],
  experimental: {
    mdxRs: true,
  },
  transpilePackages: ["three"],
  env: {
    NEXT_PUBLIC_POST_TRANSLATIONS: JSON.stringify(POST_TRANSLATIONS),
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "pbs.twimg.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "abs.twimg.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "m.media-amazon.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "images-na.ssl-images-amazon.com",
        port: "",
        pathname: "/**",
      },
    ],
  },
  headers() {
    return [
      {
        source: "/images/:path*",
        headers: [
          {
            key: "cache-control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },
  redirects() {
    return [
      {
        source: "/essays/:nested*",
        destination: "/",
        permanent: true,
      },
    ];
  },
});

function loadPostTranslations() {
  try {
    const manifest = JSON.parse(
      readFileSync(join(__dirname, "posts", "manifest.json"), "utf8"),
    );
    return manifest.translations ?? {};
  } catch {
    return {};
  }
}
