"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import useSWR from "swr";
import commaNumber from "comma-number";
import { formatString } from "@/utils/common/string-helper";
import { uiCopy } from "@/utils/ui-copy";
import type { Post } from "./get-posts";
import { PostList, PostListHeader } from "./post-list";

type SortSetting = ["date" | "views", "desc" | "asc"];

interface PostsProps {
  posts: Post[];
  as?: "div" | "main";
  className?: string;
  postIds?: string[];
}

type BasePost = {
  id: string;
  postId: string;
  title: string;
  description: string;
  summary: string;
  series: string | null;
  date: string;
  publishedAt: string;
  updatedAt: string | null;
  status: Post["status"];
  featured: boolean;
  tags: string[];
  cover: string | null;
  readingTimeMinutes: number;
};

const ITEMS_PER_PAGE = 20;

const DATE_FORMATTER = new Intl.DateTimeFormat("en-US", {
  month: "long",
  day: "numeric",
  year: "numeric",
});

export function Posts({
  posts: initialPosts,
  as: Container = "main",
  className = "m-auto mb-10 max-w-2xl font-mono text-sm",
  postIds,
}: PostsProps) {
  const [sort, setSort] = useState<SortSetting>(["date", "desc"]);
  const [currentPage, setCurrentPage] = useState(1);
  const initialBasePosts = useMemo(
    () => initialPosts.map(stripPost),
    [initialPosts]
  );
  const initialViewsMap = useMemo(
    () => buildViewsMap(initialPosts),
    [initialPosts]
  );

  const { data: basePosts = initialBasePosts } = useSWR(
    "/api/posts",
    async url => {
      const response = await fetch(url, { cache: "no-store" });
      if (!response.ok) {
        throw new Error("Failed to load posts metadata");
      }

      const data = await response.json();
      const items: Array<{
        id: string;
        title: string;
        description?: string;
        summary?: string;
        series?: string | null;
        publishedAt: string;
        updatedAt?: string | null;
        status?: Post["status"];
        featured?: boolean;
        tags?: string[];
        cover?: string | null;
        readingTimeMinutes?: number;
      }> = data.posts ?? [];

      return items.map(item => ({
        id: item.id,
        postId: item.id,
        title: item.title,
        description: item.description ?? "",
        summary: item.summary ?? item.description ?? "",
        series: item.series ?? null,
        date: formatPublishedAt(item.publishedAt),
        publishedAt: item.publishedAt,
        updatedAt: item.updatedAt ?? null,
        status: item.status ?? "published",
        featured: item.featured ?? false,
        tags: item.tags ?? [],
        cover: item.cover ?? null,
        readingTimeMinutes: item.readingTimeMinutes ?? 1,
      }));
    },
    {
      fallbackData: initialBasePosts,
      keepPreviousData: true,
      revalidateOnFocus: true,
    }
  );

  const scopedBasePosts = useMemo(() => {
    if (!postIds) {
      return basePosts;
    }

    const allowedPostIds = new Set(postIds);
    return basePosts.filter(post => allowedPostIds.has(post.id));
  }, [basePosts, postIds]);

  const ids = useMemo(
    () => scopedBasePosts.map(post => post.id),
    [scopedBasePosts]
  );

  const { data: viewsMap = initialViewsMap } = useSWR(
    ids.length ? ["/api/posts/views", ids.join(",")] : null,
    async ([, idsParam]) => {
      const response = await fetch(`/api/posts/views?ids=${idsParam}`, {
        cache: "no-store",
      });
      if (!response.ok) {
        return {};
      }

      return (await response.json()) as Record<string, number>;
    },
    {
      fallbackData: initialViewsMap,
      revalidateOnFocus: true,
      refreshInterval: () =>
        typeof document !== "undefined" &&
        document.visibilityState === "visible"
          ? 60000
          : 0,
    }
  );

  const posts = useMemo(
    () =>
      scopedBasePosts.map(post => {
        const views = viewsMap[post.id] ?? 0;
        return {
          ...post,
          views,
          viewsFormatted: commaNumber(views),
        } satisfies Post;
      }),
    [scopedBasePosts, viewsMap]
  );

  const sortedPosts = useMemo(() => {
    const [sortKey, sortDirection] = sort;

    return [...posts].sort((a, b) => {
      if (sortKey === "date") {
        return sortDirection === "desc"
          ? new Date(b.publishedAt).getTime() -
              new Date(a.publishedAt).getTime()
          : new Date(a.publishedAt).getTime() -
              new Date(b.publishedAt).getTime();
      }

      return sortDirection === "desc" ? b.views - a.views : a.views - b.views;
    });
  }, [posts, sort]);

  const paginatedPosts = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return sortedPosts.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [currentPage, sortedPosts]);

  const totalPages = Math.max(1, Math.ceil(posts.length / ITEMS_PER_PAGE));

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  function sortDate() {
    setSort(current =>
      current[0] === "date"
        ? ["date", current[1] === "asc" ? "desc" : "asc"]
        : ["date", "desc"]
    );
  }

  function sortViews() {
    setSort(current =>
      current[0] === "views"
        ? ["views", current[1] === "asc" ? "desc" : "asc"]
        : ["views", "desc"]
    );
  }

  return (
    <Suspense fallback={null}>
      <Container className={className}>
        <PostListHeader
          dateControl={
            <button
              onClick={sortDate}
              className={`h-9 w-12 text-left ${
                sort[0] === "date" ? "text-gray-700 dark:text-gray-400" : ""
              }`}
              aria-label={`Sort by ${uiCopy.post.date}`}
            >
              {uiCopy.post.date}
            </button>
          }
          viewsControl={
            <button
              onClick={sortViews}
              className={`h-9 pl-4 ${
                sort[0] === "views" ? "text-gray-700 dark:text-gray-400" : ""
              }`}
              aria-label={`Sort by ${uiCopy.post.views}`}
            >
              {uiCopy.post.views}
            </button>
          }
        />

        <PostList posts={paginatedPosts} />

        <p className="mt-4 text-center text-xs text-gray-500 dark:text-gray-400">
          {formatString(uiCopy.pagination, {
            start:
              posts.length === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1,
            end: Math.min(currentPage * ITEMS_PER_PAGE, posts.length),
            total: posts.length,
          })}
        </p>

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={page => setCurrentPage(page)}
        />
      </Container>
    </Suspense>
  );
}

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

function Pagination({
  currentPage,
  totalPages,
  onPageChange,
}: PaginationProps) {
  const pageItems = useMemo(() => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, index) => index + 1);
    }

    const visiblePages = new Set<number>();
    const windowSize = 1;

    visiblePages.add(1);
    visiblePages.add(totalPages);

    for (
      let page = Math.max(2, currentPage - windowSize);
      page <= Math.min(totalPages - 1, currentPage + windowSize);
      page += 1
    ) {
      visiblePages.add(page);
    }

    if (currentPage - windowSize <= 2) {
      for (let page = 2; page <= Math.min(4, totalPages - 1); page += 1) {
        visiblePages.add(page);
      }
    }

    if (currentPage + windowSize >= totalPages - 1) {
      for (
        let page = Math.max(2, totalPages - 3);
        page < totalPages;
        page += 1
      ) {
        visiblePages.add(page);
      }
    }

    const sortedPages = Array.from(visiblePages).sort((a, b) => a - b);
    const result: Array<number | "ellipsis"> = [];

    sortedPages.forEach((page, index) => {
      result.push(page);

      const nextPage = sortedPages[index + 1];
      if (nextPage && nextPage - page > 1) {
        result.push("ellipsis");
      }
    });

    return result;
  }, [currentPage, totalPages]);

  const changePage = (page: number) => {
    if (page === currentPage || page < 1 || page > totalPages) {
      return;
    }

    onPageChange(page);
  };

  return (
    <nav
      className="mt-4 flex items-center justify-center gap-2"
      aria-label={uiCopy.pagination}
    >
      <button
        type="button"
        onClick={() => changePage(currentPage - 1)}
        disabled={currentPage === 1}
        className="flex w-20 items-center justify-center rounded bg-gray-200 px-4 py-2 text-sm disabled:opacity-50 dark:bg-[#313131]"
      >
        {uiCopy.previous}
      </button>

      {pageItems.map((item, index) => {
        if (item === "ellipsis") {
          return (
            <span key={`ellipsis-${index}`} className="px-2 text-gray-500">
              ...
            </span>
          );
        }

        const isActive = currentPage === item;
        return (
          <button
            key={item}
            type="button"
            onClick={() => changePage(item)}
            className={`w-12 rounded px-4 py-2 ${
              isActive
                ? "bg-blue-500 text-white"
                : "bg-gray-200 dark:bg-[#313131]"
            }`}
            aria-current={isActive ? "page" : undefined}
          >
            {item}
          </button>
        );
      })}

      <button
        type="button"
        onClick={() => changePage(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="flex w-20 items-center justify-center rounded bg-gray-200 px-4 py-2 text-sm disabled:opacity-50 dark:bg-[#313131]"
      >
        {uiCopy.next}
      </button>
    </nav>
  );
}

function stripPost(post: Post): BasePost {
  return {
    id: post.id,
    postId: post.postId,
    title: post.title,
    description: post.description,
    summary: post.summary,
    series: post.series,
    date: post.date,
    publishedAt: post.publishedAt,
    updatedAt: post.updatedAt,
    status: post.status,
    featured: post.featured,
    tags: post.tags,
    cover: post.cover,
    readingTimeMinutes: post.readingTimeMinutes,
  };
}

function buildViewsMap(posts: Post[]): Record<string, number> {
  return posts.reduce<Record<string, number>>((acc, post) => {
    acc[post.id] = post.views ?? 0;
    return acc;
  }, {});
}

function formatPublishedAt(publishedAt: string): string {
  const date = new Date(publishedAt);
  if (Number.isNaN(date.getTime())) {
    return publishedAt;
  }

  return DATE_FORMATTER.format(date);
}
