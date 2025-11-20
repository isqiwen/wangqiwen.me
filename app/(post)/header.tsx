"use client";

import { useSelectedLayoutSegments } from "next/navigation";
import { useEffect, useRef } from "react";
import { format, formatDistanceToNow } from "date-fns";
import { zhCN } from "date-fns/locale";
import useSWR from "swr";
import type { Post } from "@/app/get-posts";
import useDictionary from "@/locales/dictionary-hook";

const fetcher = (url: string) => fetch(url).then(res => res.json());

export function Header({ posts, language }: { posts: Post[]; language: "zh" | "en" }) {
  const useChinese = language === "zh";
  const dict = useDictionary();

  const segments = useSelectedLayoutSegments();
  // segments can be:
  // date/post
  // lang/date/post
  const initialPost = posts.find(post => post.id === segments[segments.length - 1]);
  const canonicalPostId = initialPost?.postId;
  const localizedPost = canonicalPostId
    ? posts.find(post => post.postId === canonicalPostId && post.locale === language)
    : initialPost;

  const { data: post, mutate } = useSWR(
    `/api/view?id=${localizedPost?.id ?? ""}`,
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
                href="https://twitter.com/QiWenWang1"
                className="hover:text-gray-800 dark:hover:text-gray-400"
                target="_blank"
              >
                @({ dict.wangqiwen })
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
        </span>

        <span className="pr-1.5">
          <Views id={post.id} mutate={mutate} defaultValue={post.viewsFormatted} />
        </span>
      </p>
    </>
  );
}

function Views({ id, mutate, defaultValue }) {
  const views = defaultValue;
  const didLogViewRef = useRef(false);
  const dict = useDictionary();

  useEffect(() => {
    if ("development" === process.env.NODE_ENV) return;
    if (!didLogViewRef.current) {
      const url = "/api/view?incr=1&id=" + encodeURIComponent(id);
      fetch(url)
        .then(res => res.json())
        .then(obj => {
          mutate(obj);
        })
        .catch(console.error);
      didLogViewRef.current = true;
    }
  });

  return <>{views != null ? <span>{views} {dict.post.views}</span> : null}</>;
}

function formatDateToChinese(date: string) {
  return format(new Date(date), "yyyy年 M月 d日", { locale: zhCN });
}

function PostDate({
  post,
  useChinese,
}: {
  post: { date: string };
  useChinese: boolean;
}) {
  const dateValue = new Date(post.date);
  const relative = formatDistanceToNow(dateValue, {
    addSuffix: true,
    locale: useChinese ? zhCN : undefined,
  });

  if (useChinese) {
    return (
      <>
        {formatDateToChinese(post.date)} ({relative})
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
