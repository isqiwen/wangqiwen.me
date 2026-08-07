import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPosts } from "@/app/get-posts";
import { getSiteUrl } from "@/utils/site-config";
import { getPostsForTopic, getTopics } from "@/utils/topics";

type TopicPageProps = {
  params: Promise<{ slug: string }>;
};

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: TopicPageProps): Promise<Metadata> {
  const { slug } = await params;
  const posts = await getPosts({ includeViews: false });
  const topic = getTopics(posts).find(item => item.slug === slug);

  if (!topic) {
    return { title: "Topic not found" };
  }

  return {
    title: `${topic.name} · Topics`,
    description: `Articles about ${topic.name}.`,
    alternates: {
      canonical: getSiteUrl(`/topics/${topic.slug}`),
    },
  };
}

export default async function TopicPage({ params }: TopicPageProps) {
  const { slug } = await params;
  const posts = await getPosts({ includeViews: false });
  const topic = getTopics(posts).find(item => item.slug === slug);

  if (!topic) {
    notFound();
  }

  const topicPosts = getPostsForTopic(posts, topic.slug);

  return (
    <section className="m-auto mb-10 max-w-2xl">
      <header className="border-b border-gray-200 pb-6 dark:border-[#303030]">
        <Link
          href="/topics"
          className="font-mono text-xs text-gray-500 underline-offset-4 hover:text-gray-900 hover:underline dark:text-gray-400 dark:hover:text-gray-100"
        >
          Topics
        </Link>
        <h1 className="mt-3 text-3xl font-bold tracking-tight dark:text-gray-100">{topic.name}</h1>
        <p className="mt-3 leading-7 text-gray-600 dark:text-gray-400">
          {topic.count} {topic.count === 1 ? "article" : "articles"} about {topic.name}.
        </p>
      </header>

      <ol className="mt-2 divide-y divide-gray-200 dark:divide-[#303030]">
        {topicPosts.map(post => (
          <li key={post.id}>
            <Link
              href={`/${post.publishedAt.slice(0, 4)}/${post.id}`}
              className="block py-5 transition-colors hover:text-gray-600 focus:outline-none dark:hover:text-gray-300"
            >
              <div className="flex items-baseline justify-between gap-4">
                <h2 className="font-medium text-gray-900 dark:text-gray-100">{post.title}</h2>
                <time className="shrink-0 font-mono text-xs text-gray-500 dark:text-gray-400">
                  {post.date}
                </time>
              </div>
              {post.summary || post.description ? (
                <p className="mt-2 leading-7 text-gray-600 dark:text-gray-400">
                  {post.summary || post.description}
                </p>
              ) : null}
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}
