import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/utils/site-config";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/editor"],
    },
    sitemap: getSiteUrl("/sitemap.xml"),
  };
}
