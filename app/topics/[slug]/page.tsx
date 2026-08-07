import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPosts } from "@/app/get-posts";
import { PostList } from "@/app/post-list";
import { getSiteUrl } from "@/utils/site-config";
import { getPostsForTopic, getTopics } from "@/utils/topics";

type TopicPageProps = {
  params: Promise<{ slug: string }>;
};

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: TopicPageProps): Promise<Metadata> {
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
  const posts = await getPosts();
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
        <h1 className="mt-3 text-3xl font-bold tracking-tight dark:text-gray-100">
          {topic.name}
        </h1>
        <p className="mt-3 leading-7 text-gray-600 dark:text-gray-400">
          {topic.count} {topic.count === 1 ? "article" : "articles"} about{" "}
          {topic.name}.
        </p>
      </header>

      <div className="mt-6 font-mono text-sm">
        <PostList posts={topicPosts} />
      </div>
    </section>
  );
}
