import type { Metadata } from "next";
import Link from "next/link";
import { getPosts } from "@/app/get-posts";
import { getSiteUrl } from "@/utils/site-config";
import { getTopics } from "@/utils/topics";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Topics",
  description: "Browse writing by topic.",
  alternates: {
    canonical: getSiteUrl("/topics"),
  },
};

export default async function TopicsPage() {
  const posts = await getPosts({ includeViews: false });
  const topics = getTopics(posts);

  return (
    <section className="m-auto mb-10 max-w-2xl">
      <header className="border-b border-gray-200 pb-6 dark:border-[#303030]">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400">
          Browse the archive
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight dark:text-gray-100">Topics</h1>
        <p className="mt-3 max-w-xl leading-7 text-gray-600 dark:text-gray-400">
          Explore the ideas that connect the writing on this site.
        </p>
      </header>

      <ul className="mt-6 grid gap-3 sm:grid-cols-2" aria-label="Topics">
        {topics.map(topic => (
          <li key={topic.slug}>
            <Link
              href={`/topics/${topic.slug}`}
              className="flex h-full items-baseline justify-between gap-3 rounded-md border border-gray-200 px-4 py-4 transition-colors hover:bg-gray-100 focus:bg-gray-100 focus:outline-none dark:border-[#3d3d3d] dark:hover:bg-[#303030] dark:focus:bg-[#303030]"
            >
              <span className="font-medium text-gray-900 dark:text-gray-100">{topic.name}</span>
              <span className="shrink-0 font-mono text-xs text-gray-500 dark:text-gray-400">
                {topic.count} {topic.count === 1 ? "article" : "articles"}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
