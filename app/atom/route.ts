import { getPosts } from "@/app/get-posts";
import { getSiteUrl, siteConfig } from "@/utils/site-config";

export const revalidate = 60;

export async function GET() {
  const posts = (await getPosts({ includeViews: false })).slice(0, 100);
  const updated =
    posts
      .map(post => toRfc3339(post.updatedAt ?? post.publishedAt))
      .sort()
      .at(-1) ?? new Date().toISOString();
  const authorEmail = siteConfig.author.email
    ? `<email>${escapeXml(siteConfig.author.email)}</email>`
    : "";
  const entries = posts
    .map(post => {
      const postUrl = getSiteUrl(`/${post.publishedAt.slice(0, 4)}/${post.id}`);
      return `
        <entry>
          <id>${escapeXml(postUrl)}</id>
          <title>${escapeXml(post.title)}</title>
          <link href="${escapeXml(postUrl)}"/>
          <updated>${toRfc3339(post.updatedAt ?? post.publishedAt)}</updated>
        </entry>`;
    })
    .join("");

  return new Response(
    `<?xml version="1.0" encoding="utf-8"?>
  <feed xmlns="http://www.w3.org/2005/Atom">
    <title>${escapeXml(siteConfig.site.name)}</title>
    <subtitle>${escapeXml(siteConfig.feed.subtitle)}</subtitle>
    <link href="${escapeXml(getSiteUrl("/atom"))}" rel="self"/>
    <link href="${escapeXml(getSiteUrl("/"))}"/>
    <updated>${updated}</updated>
    <id>${escapeXml(getSiteUrl("/"))}</id>
    <author>
      <name>${escapeXml(siteConfig.site.name)}</name>
      ${authorEmail}
    </author>${entries}
  </feed>`,
    {
      headers: {
        "Content-Type": "application/atom+xml; charset=utf-8",
      },
    }
  );
}

function toRfc3339(value: string): string {
  const date = new Date(
    /^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T00:00:00.000Z` : value
  );
  return Number.isNaN(date.getTime())
    ? new Date(0).toISOString()
    : date.toISOString();
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
