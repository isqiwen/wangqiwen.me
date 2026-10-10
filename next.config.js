const withMDX = require("@next/mdx")();

// Sent with every response. There is deliberately no script or style
// allowlist: pages are prerendered and rely on inline scripts, so a nonce-based
// policy would force dynamic rendering. These directives hold without one.
const securityHeaders = [
  // No includeSubDomains: other hosts on this domain own their transport policy.
  { key: "strict-transport-security", value: "max-age=31536000" },
  { key: "x-content-type-options", value: "nosniff" },
  { key: "x-frame-options", value: "SAMEORIGIN" },
  { key: "referrer-policy", value: "strict-origin-when-cross-origin" },
  {
    key: "permissions-policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
  {
    key: "content-security-policy",
    value:
      "base-uri 'self'; form-action 'self'; frame-ancestors 'self'; object-src 'none'",
  },
];

module.exports = withMDX({
  output: "standalone",
  distDir: process.env.NEXT_DIST_DIR || ".next",
  allowedDevOrigins: ["localhost", "127.0.0.1"],
  poweredByHeader: false,
  pageExtensions: ["ts", "tsx", "js", "jsx", "md", "mdx"],
  experimental: {
    mdxRs: true,
  },
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
    ],
  },
  headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
      {
        // Font files keep their names across releases, so they are cached for a
        // month rather than forever. Without this they are revalidated on
        // every page load.
        source: "/fonts/:path*",
        headers: [
          {
            key: "cache-control",
            value: "public, max-age=2592000",
          },
        ],
      },
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
});
