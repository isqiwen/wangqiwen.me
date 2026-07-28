const withMDX = require("@next/mdx")({
  options: {
    remarkPlugins: [require.resolve("./utils/remark/remove-frontmatter")],
  },
});

module.exports = withMDX({
  output: "standalone",
  allowedDevOrigins: ["localhost", "127.0.0.1"],
  poweredByHeader: false,
  pageExtensions: ["ts", "tsx", "js", "jsx", "md", "mdx"],
  experimental: {
    mdxRs: true,
  },
  transpilePackages: ["three"],
  images: {
    minimumCacheTTL: 2678400,
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
