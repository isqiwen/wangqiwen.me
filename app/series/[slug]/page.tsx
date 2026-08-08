import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPosts } from "@/app/get-posts";
import { getSiteUrl } from "@/utils/site-config";
import {
  getPostsForSeries,
  getSeries,
  getSeriesDefinition,
} from "@/utils/series";

type SeriesPageProps = {
  params: Promise<{ slug: string }>;
};

export const revalidate = 60;
export const dynamicParams = false;

export async function generateStaticParams() {
  const posts = await getPosts({ includeViews: false });

  return getSeries(posts).map(series => ({ slug: series.slug }));
}

export async function generateMetadata({
  params,
}: SeriesPageProps): Promise<Metadata> {
  const { slug } = await params;
  const posts = await getPosts({ includeViews: false });
  const definition = getSeriesDefinition(slug);
  const hasPublishedPosts = getSeries(posts).some(
    series => series.slug === slug
  );

  if (!definition || !hasPublishedPosts) {
    return { title: "Series not found" };
  }

  return {
    title: `${definition.title} · Series`,
    description: definition.description,
    alternates: {
      canonical: getSiteUrl(`/series/${definition.slug}`),
    },
  };
}

export default async function SeriesDetailPage({ params }: SeriesPageProps) {
  const { slug } = await params;
  const posts = await getPosts({ includeViews: false });
  const definition = getSeriesDefinition(slug);
  const seriesPosts = getPostsForSeries(posts, slug);

  if (!definition || seriesPosts.length === 0) {
    notFound();
  }

  return (
    <section className="m-auto mb-10 max-w-2xl">
      <header className="border-b border-gray-200 pb-7 dark:border-[#303030]">
        <Link
          href="/series"
          className="font-mono text-xs text-gray-500 underline-offset-4 hover:text-gray-900 hover:underline dark:text-gray-400 dark:hover:text-gray-100"
        >
          Series
        </Link>
        <h1 className="mt-3 text-3xl font-bold tracking-tight dark:text-gray-100">
          {definition.title}
        </h1>
        <p className="mt-3 max-w-xl text-sm leading-6 text-gray-600 dark:text-gray-400">
          {definition.description}
        </p>
      </header>

      <ol
        className="mt-6 space-y-3"
        aria-label={`${definition.title} articles`}
      >
        {seriesPosts.map((post, index) => (
          <li key={post.id}>
            <Link
              href={`/${post.publishedAt.slice(0, 4)}/${post.id}`}
              className="group flex gap-4 rounded-md border border-gray-200 px-4 py-4 transition-colors hover:bg-gray-100 focus:bg-gray-100 focus:outline-none dark:border-[#3d3d3d] dark:hover:bg-[#303030] dark:focus:bg-[#303030]"
            >
              <span className="pt-0.5 font-mono text-xs text-gray-500 dark:text-gray-400">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className="min-w-0">
                <span className="block font-medium text-gray-900 dark:text-gray-100">
                  {post.title}
                </span>
                <span className="mt-1 block text-sm leading-6 text-gray-600 dark:text-gray-400">
                  {post.summary || post.description}
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}
