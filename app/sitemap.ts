import type { MetadataRoute } from "next";
import { getPosts } from "@/app/get-posts";
import { getSiteUrl } from "@/utils/site-config";
import { getTopics } from "@/utils/topics";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = await getPosts({ includeViews: false });

  return [
    {
      url: getSiteUrl("/"),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: getSiteUrl("/about"),
      changeFrequency: "yearly",
      priority: 0.6,
    },
    {
      url: getSiteUrl("/topics"),
      changeFrequency: "weekly",
      priority: 0.7,
    },
    ...getTopics(posts).map(topic => ({
      url: getSiteUrl(`/topics/${topic.slug}`),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
    ...posts.map(post => ({
      url: getSiteUrl(`/${post.publishedAt.slice(0, 4)}/${post.id}`),
      lastModified: post.updatedAt ?? post.publishedAt,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
  ];
}
