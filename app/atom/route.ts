import { getPosts } from "@/app/get-posts";
import { getSiteUrl, siteConfig } from "@/utils/site-config";

export async function GET() {
  const posts = await getPosts();
  const max = 100; // max returned posts
  const updated = posts[0]?.date ?? new Date().toISOString();
  const authorEmail = siteConfig.author.email
    ? `<email>${siteConfig.author.email}</email>`
    : "";

  return new Response(
    `<?xml version="1.0" encoding="utf-8"?>
  <feed xmlns="http://www.w3.org/2005/Atom">
    <title>${siteConfig.site.name}</title>
    <subtitle>${siteConfig.feed.subtitle}</subtitle>
    <link href="${getSiteUrl("/atom")}" rel="self"/>
    <link href="${siteConfig.site.url}/"/>
    <updated>${updated}</updated>
    <id>${siteConfig.site.url}/</id>
    <author>
      <name>${siteConfig.site.name}</name>
      ${authorEmail}
    </author>
    ${posts.slice(0, max).reduce((acc, post) => {
      const dateMatch = post.date.match(/\d{4}/);
      if (!dateMatch) return "";
      return `${acc}
        <entry>
          <id>${post.id}</id>
          <title>${post.title}</title>
          <link href="${getSiteUrl(`/${dateMatch[0]}/${post.id}`)}"/>
          <updated>${post.date}</updated>
        </entry>`;
    }, "")}
  </feed>`,
    {
      headers: {
        "Content-Type": "application/atom+xml; charset=utf-8",
      },
    }
  );
}
