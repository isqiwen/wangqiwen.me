"use client";

import { useSelectedLayoutSegments } from "next/navigation";
import { useEffect } from "react";
import useSWR from "swr";
import type { Post } from "@/app/get-posts";
import { PostDate } from "@/app/(post)/post-date";
import { formatCount } from "@/utils/common/string-helper";
import { logger } from "@/utils/logger";
import { uiCopy } from "@/utils/ui-copy";
import { getPrimarySocialHandle, siteConfig } from "@/utils/site-config";
import { getTopicSlug } from "@/utils/topics";
import { getSeriesContext } from "@/utils/series";
import Link from "next/link";

type ViewCount = { id: string; views: number | null };

const VIEWS_REFRESH_MS = 60 * 1000;
const isDevelopment = process.env.NODE_ENV === "development";

async function fetchViewCount(url: string): Promise<ViewCount> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to load the view count: ${response.status}`);
  }
  return response.json();
}

export function Header({ posts }: { posts: Post[] }) {
  const segments = useSelectedLayoutSegments();
  const post = posts.find(item => item.id === segments[segments.length - 1]);

  if (post == null) {
    return null;
  }

  const seriesContext = getSeriesContext(post, posts);

  return (
    <>
      {seriesContext ? (
        <p className="mb-2 font-mono text-xs text-gray-500 dark:text-gray-400">
          <Link
            href={`/series/${seriesContext.definition.slug}`}
            className="text-gray-700 underline-offset-4 hover:underline dark:text-gray-200"
          >
            {seriesContext.definition.title}
          </Link>
          <span aria-hidden="true"> · </span>
          Part {seriesContext.position} of {seriesContext.posts.length}
        </p>
      ) : null}
      <h1 className="mb-1 text-2xl font-bold dark:text-gray-100">
        {post.title}
      </h1>

      <p className="flex font-mono text-xs text-gray-500 dark:text-gray-500">
        <span className="flex-grow">
          <span className="hidden md:inline">
            <a
              href={siteConfig.social.primary.url}
              className="hover:text-gray-800 dark:hover:text-gray-400"
              target="_blank"
              rel="noreferrer"
            >
              {getPrimarySocialHandle()}
            </a>
            <span className="mx-2">|</span>
          </span>

          <span suppressHydrationWarning={true}>
            <PostDate post={post} />
          </span>

          <span className="mx-2">|</span>

          <span>
            {formatReadingTime(
              post.readingTimeMinutes,
              uiCopy.post.readingTime
            )}
          </span>
        </span>

        <Views id={post.id} />
      </p>

      {post.tags.length > 0 ? (
        <nav className="mt-3" aria-label="Topics">
          <ul className="flex flex-wrap gap-2">
            {post.tags.map(tag => (
              <li key={tag}>
                <Link
                  href={`/topics/${getTopicSlug(tag)}`}
                  className="rounded-full border border-gray-200 px-2.5 py-1 font-mono text-xs text-gray-600 transition-colors hover:bg-gray-100 dark:border-[#3d3d3d] dark:text-gray-400 dark:hover:bg-[#303030]"
                >
                  {tag}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      ) : null}
    </>
  );
}

function Views({ id }: { id: string }) {
  const endpoint = `/api/view?id=${encodeURIComponent(id)}`;
  // In production the request that records the visit also returns the count,
  // so there is nothing to fetch on mount. Development records no visits.
  const { data, mutate } = useSWR<ViewCount>(endpoint, fetchViewCount, {
    refreshInterval: VIEWS_REFRESH_MS,
    revalidateOnMount: isDevelopment,
    revalidateOnFocus: false,
  });

  useEffect(() => {
    if (isDevelopment) return;

    let cancelled = false;
    fetchViewCount(`${endpoint}&incr=1`)
      .then(result => {
        if (!cancelled) {
          void mutate(result, { revalidate: false });
        }
      })
      .catch(error => {
        logger.error("Failed to record page view.", error);
      });

    return () => {
      cancelled = true;
    };
  }, [endpoint, mutate]);

  // Omitted until known, and whenever the count is unavailable.
  if (data?.views == null) {
    return null;
  }

  return (
    <span className="pr-1.5" data-view-count="true">
      {formatCount(data.views)} {uiCopy.post.views}
    </span>
  );
}

function formatReadingTime(value: number, label: string) {
  const minutes = Math.max(1, Math.round(value || 1));
  return `${minutes} ${label}`;
}
