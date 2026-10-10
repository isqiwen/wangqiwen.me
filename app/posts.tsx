"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import { formatString } from "@/utils/common/string-helper";
import { uiCopy } from "@/utils/ui-copy";
import type { Post } from "./get-posts";
import { PostList, PostListHeader, type ViewCounts } from "./post-list";

type SortSetting = ["date" | "views", "desc" | "asc"];

interface PostsProps {
  posts: Post[];
  as?: "div" | "main";
  className?: string;
}

const ITEMS_PER_PAGE = 20;
const VIEWS_REFRESH_MS = 60 * 1000;

async function fetchViewCounts([endpoint, ids]: [
  string,
  string
]): Promise<ViewCounts> {
  const response = await fetch(`${endpoint}?ids=${ids}`, {
    cache: "no-store",
  });
  return response.ok ? ((await response.json()) as ViewCounts) : {};
}

export function Posts({
  posts,
  as: Container = "main",
  className = "m-auto mb-10 max-w-2xl font-mono text-sm",
}: PostsProps) {
  const [sort, setSort] = useState<SortSetting>(["date", "desc"]);
  const [currentPage, setCurrentPage] = useState(1);
  const ids = useMemo(() => posts.map(post => post.id).join(","), [posts]);

  // The list itself is part of the page and changes only with a deployment.
  // The counts change at any time, so they alone are fetched.
  const { data: views = {} } = useSWR(
    ids ? ["/api/posts/views", ids] : null,
    fetchViewCounts,
    {
      revalidateOnFocus: true,
      refreshInterval: () =>
        typeof document !== "undefined" &&
        document.visibilityState === "visible"
          ? VIEWS_REFRESH_MS
          : 0,
    }
  );

  const sortedPosts = useMemo(() => {
    const [sortKey, sortDirection] = sort;
    const direction = sortDirection === "desc" ? -1 : 1;

    return [...posts].sort(
      (a, b) =>
        direction *
        (sortKey === "date"
          ? Date.parse(a.publishedAt) - Date.parse(b.publishedAt)
          : (views[a.id] ?? 0) - (views[b.id] ?? 0))
    );
  }, [posts, sort, views]);

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

        <PostList posts={paginatedPosts} views={views} />

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
