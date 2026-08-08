import type { Metadata } from "next";
import Link from "next/link";
import { getPosts } from "@/app/get-posts";
import { getSiteUrl } from "@/utils/site-config";
import { getSeries } from "@/utils/series";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Series",
  description: "Browse multi-part writing in its intended reading order.",
  alternates: {
    canonical: getSiteUrl("/series"),
  },
};

export default async function SeriesPage() {
  const posts = await getPosts({ includeViews: false });
  const series = getSeries(posts);

  return (
    <section className="m-auto mb-10 max-w-2xl">
      <header className="pb-3">
        <h1 className="text-3xl font-bold tracking-tight dark:text-gray-100">
          Series
        </h1>
      </header>

      {series.length > 0 ? (
        <ul className="mt-3 grid gap-3" aria-label="Series">
          {series.map(definition => (
            <li key={definition.slug}>
              <Link
                href={`/series/${definition.slug}`}
                className="block rounded-md border border-gray-200 px-4 py-4 transition-colors hover:bg-gray-100 focus:bg-gray-100 focus:outline-none dark:border-[#3d3d3d] dark:hover:bg-[#303030] dark:focus:bg-[#303030]"
              >
                <div className="flex items-baseline justify-between gap-4">
                  <h2 className="font-medium text-gray-900 dark:text-gray-100">
                    {definition.title}
                  </h2>
                  <span className="shrink-0 font-mono text-xs text-gray-500 dark:text-gray-400">
                    {definition.count}{" "}
                    {definition.count === 1 ? "article" : "articles"}
                  </span>
                </div>
                <p className="mt-2 text-sm leading-6 text-gray-600 dark:text-gray-400">
                  {definition.description}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">
          No published series yet.
        </p>
      )}
    </section>
  );
}
