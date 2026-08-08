"use client";

import { useSelectedLayoutSegments } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import useSWR, { type KeyedMutator } from "swr";
import type { Post } from "@/app/get-posts";
import { PostDate } from "@/app/(post)/post-date";
import { logger } from "@/utils/logger";
import { uiCopy } from "@/utils/ui-copy";
import { getPrimarySocialHandle, siteConfig } from "@/utils/site-config";
import { getTopicSlug } from "@/utils/topics";
import { getSeriesContext } from "@/utils/series";
import Link from "next/link";

const fetcher = async (url: string): Promise<Post> => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to load post metadata: ${response.status}`);
  }
  return response.json();
};

export function Header({ posts }: { posts: Post[] }) {
  const segments = useSelectedLayoutSegments();
  const initialPost = posts.find(
    post => post.id === segments[segments.length - 1]
  );
  const post = initialPost ?? null;
  const viewEndpoint = post
    ? `/api/view?id=${encodeURIComponent(post.id)}`
    : null;
  const [liveViewPostId, setLiveViewPostId] = useState<string | null>(null);

  const { data: hydratedPost, mutate } = useSWR<Post>(viewEndpoint, fetcher, {
    fallbackData: post ?? undefined,
    refreshInterval: post ? 60000 : 0,
    onSuccess: latestPost => {
      setLiveViewPostId(latestPost.id);
    },
  });

  if (post == null || hydratedPost == null) {
    return null;
  }

  const seriesContext = getSeriesContext(hydratedPost, posts);

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
        {hydratedPost.title}
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
            <PostDate post={hydratedPost} />
          </span>

          <span className="mx-2">|</span>

          <span>
            {formatReadingTime(
              hydratedPost.readingTimeMinutes,
              uiCopy.post.readingTime
            )}
          </span>
        </span>

        <Views
          id={hydratedPost.id}
          mutate={mutate}
          defaultValue={hydratedPost.viewsFormatted}
          show={liveViewPostId === hydratedPost.id}
          onLoaded={setLiveViewPostId}
        />
      </p>

      {hydratedPost.tags.length > 0 ? (
        <nav className="mt-3" aria-label="Topics">
          <ul className="flex flex-wrap gap-2">
            {hydratedPost.tags.map(tag => (
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

function Views({
  id,
  mutate,
  defaultValue,
  show,
  onLoaded,
}: {
  id: string;
  mutate: KeyedMutator<Post>;
  defaultValue: string;
  show: boolean;
  onLoaded: (postId: string) => void;
}) {
  const views = defaultValue;
  const didLogViewRef = useRef(false);

  useEffect(() => {
    didLogViewRef.current = false;
  }, [id]);

  useEffect(() => {
    if ("development" === process.env.NODE_ENV) return;
    if (!didLogViewRef.current) {
      const url = `/api/view?incr=1&id=${encodeURIComponent(id)}`;
      fetch(url)
        .then(async res => {
          if (!res.ok) {
            throw new Error(`Failed to record page view: ${res.status}`);
          }
          return res.json();
        })
        .then(obj => {
          mutate(obj);
          onLoaded(obj.id);
        })
        .catch(error => {
          logger.error("Failed to record page view.", error);
        });
      didLogViewRef.current = true;
    }
  }, [id, mutate, onLoaded]);

  if (!show || views == null) {
    return null;
  }

  return (
    <span className="pr-1.5" data-view-count="true">
      {views} {uiCopy.post.views}
    </span>
  );
}

function formatReadingTime(value: number, label: string) {
  const minutes = Math.max(1, Math.round(value || 1));
  return `${minutes} ${label}`;
}
