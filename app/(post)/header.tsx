"use client";

import { useSelectedLayoutSegments } from "next/navigation";
import { useEffect, useRef } from "react";
import { format, formatDistanceToNow } from "date-fns";
import { zhCN } from "date-fns/locale";
import useSWR from "swr";
import type { Post } from "@/app/get-posts";
import useDictionary from "@/locales/dictionary-hook";
import type { Locale } from "@/locales/config";
import { logger } from "@/utils/logger";
import { getPrimarySocialHandle, siteConfig } from "@/utils/site-config";

const fetcher = (url: string) => fetch(url).then(res => res.json());

export function Header({ posts, language }: { posts: Post[]; language: Locale }) {
  const useChinese = language === "zh";
  const dict = useDictionary();

  const segments = useSelectedLayoutSegments();
  // segments can be:
  // date/post
  // lang/date/post
  const initialPost = posts.find(post => post.id === segments[segments.length - 1]);
  const basePostId = initialPost?.postId;
  const localizedPost = basePostId
    ? posts.find(post => post.postId === basePostId && post.locale === language)
    : initialPost;
  const viewEndpoint = localizedPost
    ? `/api/view?id=${encodeURIComponent(localizedPost.id)}&locale=${language}`
    : "/api/view?id=";

  const { data: post, mutate } = useSWR(
    viewEndpoint,
    fetcher,
    {
      fallbackData: localizedPost,
      refreshInterval: 5000,
    }
  );

  if (localizedPost == null) return <></>;

  return (
    <>
      <h1 className="text-2xl font-bold mb-1 dark:text-gray-100">{post.title}</h1>

      <p className="font-mono flex text-xs text-gray-500 dark:text-gray-500">
        <span className="flex-grow">
          <span className="hidden md:inline">
            <span>
              <a
                href={siteConfig.social.primary.url}
                className="hover:text-gray-800 dark:hover:text-gray-400"
                target="_blank"
                rel="noreferrer"
              >
                {getPrimarySocialHandle()}
              </a>
            </span>

            <span className="mx-2">|</span>
          </span>

          {/* since we will pre-render the relative time, over time it
           * will diverge with what the user relative time is, so we suppress the warning.
           * In practice this is not an issue because we revalidate the entire page over time
           * and because we will move this to a server component with template.tsx at some point */}
          <span suppressHydrationWarning={true}>
            <PostDate post={post} useChinese={useChinese} />
          </span>

          <span className="mx-2">|</span>

          <span>
            {formatReadingTime(post.readingTimeMinutes, useChinese, dict.post.readingTime)}
          </span>
        </span>

        <span className="pr-1.5">
          <Views
            id={post.id}
            language={language}
            mutate={mutate}
            defaultValue={post.viewsFormatted}
          />
        </span>
      </p>
    </>
  );
}

function Views({ id, language, mutate, defaultValue }) {
  const views = defaultValue;
  const didLogViewRef = useRef(false);
  const dict = useDictionary();

  useEffect(() => {
    didLogViewRef.current = false;
  }, [id, language]);

  useEffect(() => {
    if ("development" === process.env.NODE_ENV) return;
    if (!didLogViewRef.current) {
      const url = `/api/view?incr=1&id=${encodeURIComponent(id)}&locale=${language}`;
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
  }, [id, language, mutate]);

  return <>{views != null ? <span>{views} {dict.post.views}</span> : null}</>;
}

function formatDateToChinese(date: string) {
  return format(new Date(date), "yyyy年 M月 d日", { locale: zhCN });
}

function PostDate({
  post,
  useChinese,
}: {
  post: { date: string; publishedAt: string };
  useChinese: boolean;
}) {
  const dateValue = new Date(post.publishedAt);
  const relative = formatDistanceToNow(dateValue, {
    addSuffix: true,
    locale: useChinese ? zhCN : undefined,
  });

  if (useChinese) {
    return (
      <>
        {formatDateToChinese(post.publishedAt)} ({relative})
      </>
    );
  } else {
    return (
      <>
        {post.date} ({relative})
      </>
    );
  }
}

function formatReadingTime(
  value: number,
  useChinese: boolean,
  label: string,
) {
  const minutes = Math.max(1, Math.round(value || 1));
  return useChinese ? `${minutes} ${label}` : `${minutes} ${label}`;
}
