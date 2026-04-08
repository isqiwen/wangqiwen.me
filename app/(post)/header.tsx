"use client";

import { useSelectedLayoutSegments } from "next/navigation";
import { useEffect, useRef } from "react";
import { formatDistanceToNow } from "date-fns";
import useSWR, { type KeyedMutator } from "swr";
import type { Post } from "@/app/get-posts";
import { logger } from "@/utils/logger";
import { uiCopy } from "@/utils/ui-copy";
import { getPrimarySocialHandle, siteConfig } from "@/utils/site-config";

const fetcher = async (url: string): Promise<Post> => {
  const response = await fetch(url);
  return response.json();
};

export function Header({ posts }: { posts: Post[] }) {
  const segments = useSelectedLayoutSegments();
  const initialPost = posts.find(post => post.id === segments[segments.length - 1]);
  const post = initialPost ?? null;
  const viewEndpoint = post ? `/api/view?id=${encodeURIComponent(post.id)}` : null;

  const { data: hydratedPost, mutate } = useSWR<Post>(viewEndpoint, fetcher, {
    fallbackData: post ?? undefined,
    refreshInterval: post ? 5000 : 0,
  });

  if (post == null || hydratedPost == null) {
    return null;
  }

  return (
    <>
      <h1 className="mb-1 text-2xl font-bold dark:text-gray-100">{hydratedPost.title}</h1>

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

          <span>{formatReadingTime(hydratedPost.readingTimeMinutes, uiCopy.post.readingTime)}</span>
        </span>

        <span className="pr-1.5">
          <Views
            id={hydratedPost.id}
            mutate={mutate}
            defaultValue={hydratedPost.viewsFormatted}
          />
        </span>
      </p>
    </>
  );
}

function Views({
  id,
  mutate,
  defaultValue,
}: {
  id: string;
  mutate: KeyedMutator<Post>;
  defaultValue: string;
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
        .then(res => res.json())
        .then(obj => {
          mutate(obj);
        })
        .catch(error => {
          logger.error("Failed to record page view.", error);
        });
      didLogViewRef.current = true;
    }
  }, [id, mutate]);

  return <>{views != null ? <span>{views} {uiCopy.post.views}</span> : null}</>;
}

function PostDate({ post }: { post: { date: string; publishedAt: string } }) {
  const dateValue = new Date(post.publishedAt);
  const relative = formatDistanceToNow(dateValue, { addSuffix: true });

  return (
    <>
      {post.date} ({relative})
    </>
  );
}

function formatReadingTime(value: number, label: string) {
  const minutes = Math.max(1, Math.round(value || 1));
  return `${minutes} ${label}`;
}
