import { ArticleSearch } from "./article-search";
import { getPosts } from "./get-posts";
import { ThemeToggle } from "./themes/theme-toggle";
import { Logo } from "./logo";
import Link from "next/link";
import { getFollowLabel, getNavigationLinks, siteConfig } from "@/utils/site-config";

export async function Header() {
  const navigationLinks = getNavigationLinks();
  const followLabel = getFollowLabel();
  const articles = (await getPosts({ includeViews: false })).map(post => ({
    id: post.id,
    title: post.title,
    description: post.description,
    summary: post.summary,
    tags: post.tags,
    publishedAt: post.publishedAt,
  }));

  return (
    <header className="mb-5 flex items-center md:mb-10">
      <Logo />

      <nav className="flex grow items-center justify-end gap-1 font-mono text-xs md:gap-3">
        <ThemeToggle />
        <ArticleSearch articles={articles} />

        {navigationLinks.map(item => (
          <Link
            key={item.href}
            href={item.href}
            className="inline-flex rounded-sm p-2 transition-[background-color] hover:bg-gray-200 active:bg-gray-300 dark:hover:bg-[#313131] dark:active:bg-[#242424]"
          >
            {item.label}
          </Link>
        ))}
        {siteConfig.social.primary.url ? (
          <a
            href={siteConfig.social.primary.url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center whitespace-nowrap rounded-sm p-2 transition-[background-color] hover:bg-gray-200 active:bg-gray-300 dark:hover:bg-[#313131] dark:active:bg-[#242424] md:-mr-2"
          >
            <TweetIcon style={{ marginRight: 4 }} />
            {followLabel}
          </a>
        ) : null}
      </nav>
    </header>
  );
}

function TweetIcon(props: any) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={16}
      height={16}
      viewBox="0 0 24 24"
      {...props}
    >
      <path
        fill="currentColor"
        fillRule="nonzero"
        stroke="none"
        strokeWidth={1}
        d="M8.28 20.26c7.55 0 11.68-6.26 11.68-11.67v-.53c.8-.58 1.49-1.3 2.04-2.13-.74.33-1.53.54-2.36.65.85-.5 1.5-1.32 1.8-2.28-.78.48-1.66.81-2.6 1a4.1 4.1 0 0 0-7 3.74c-3.4-.17-6.43-1.8-8.46-4.29a4.1 4.1 0 0 0 1.28 5.48c-.68-.02-1.3-.2-1.86-.5v.05a4.11 4.11 0 0 0 3.29 4.02 4 4 0 0 1-1.85.08 4.1 4.1 0 0 0 3.83 2.85A8.23 8.23 0 0 1 2 18.43a11.67 11.67 0 0 0 6.28 1.83"
      />
    </svg>
  );
}
