import links from "@/links.json";
import { notFound } from "next/navigation";
import { getSiteUrl, siteConfig } from "@/utils/site-config";

export default function LinkHead({ params }: { params: { id: string } }) {
  const link = links[params.id];

  if (link == null) {
    return notFound();
  }

  return (
    <>
      <meta property="og:title" content={link.title} />
      <meta property="og:site_name" content={siteConfig.site.name} />
      <meta property="og:description" content={link.description} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content={`@${siteConfig.social.primary.handle}`} />
      <meta
        property="og:image"
        content={getSiteUrl(`/og/${link.image}`)}
      />
    </>
  );
}
