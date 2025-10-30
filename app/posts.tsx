"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Suspense } from "react";
import useSWR from "swr";
import useDictionary from "@/locales/dictionary-hook";
import { formatString } from "@/utils/common/string-helper";
import type { Post } from "./get-posts";

type SortSetting = ["date" | "views", "desc" | "asc"];

interface PostsProps {
  posts: Post[];
  language: "zh" | "en";
}

const fetcher = (url: string) =>
  fetch(url).then((res) => res.json() as Promise<Post[]>);

export function Posts({ posts: initialPosts, language }: PostsProps) {
  const [sort, setSort] = useState<SortSetting>(["date", "desc"]);
  const [currentPage, setCurrentPage] = useState(1); // 当前页码
  const itemsPerPage = 20; // 每页显示的项目数量

  const { data: posts = initialPosts } = useSWR<Post[]>("/api/posts", fetcher, {
    fallbackData: initialPosts,
    refreshInterval: 5000,
  });

  function sortDate() {
    setSort((sort) => [
      "date",
      sort[0] !== "date" || sort[1] === "asc" ? "desc" : "asc",
    ]);
  }

  function sortViews() {
    setSort((sort) => [
      sort[0] === "views" && sort[1] === "asc" ? "date" : "views",
      sort[0] !== "views" ? "desc" : sort[1] === "asc" ? "desc" : "asc",
    ]);
  }

  const useChinese = language === "zh";
  const dict = useDictionary();

  const sortedPosts = useMemo(() => {
    const [sortKey, sortDirection] = sort;

    return [...posts].sort((a, b) => {
      if (sortKey === "date") {
        return sortDirection === "desc"
          ? new Date(b.date).getTime() - new Date(a.date).getTime()
          : new Date(a.date).getTime() - new Date(b.date).getTime();
      }

      return sortDirection === "desc" ? b.views - a.views : a.views - b.views;
    });
  }, [posts, sort]);

  // 计算当前页显示的数据
  const paginatedPosts = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return sortedPosts.slice(startIndex, endIndex);
  }, [sortedPosts, currentPage, itemsPerPage]);

  // 计算总页数
  const totalPages = Math.ceil(posts.length / itemsPerPage);

  return (
    <Suspense fallback={null}>
      <main className="max-w-2xl font-mono m-auto mb-10 text-sm">
        <header className="text-gray-500 dark:text-gray-600 flex items-center text-xs">
          <button
            onClick={sortDate}
            className={`w-12 h-9 text-left ${
              sort[0] === "date" && sort[1] !== "desc"
                ? "text-gray-700 dark:text-gray-400"
                : ""
            }`}
          >
            {dict.post.date}
            {sort[0] === "date" && sort[1] === "asc" && "↑"}
          </button>
          <span className="grow pl-2">{dict.post.title}</span>
          <button
            onClick={sortViews}
            className={`h-9 pl-4 ${
              sort[0] === "views" ? "text-gray-700 dark:text-gray-400" : ""
            }`}
          >
            {dict.post.views}
            {sort[0] === "views" ? (sort[1] === "asc" ? "↑" : "↓") : ""}
          </button>
        </header>

        {/* 列表渲染 */}
        <List posts={paginatedPosts} useChinese={useChinese} />

        {/* 当前页信息 */}
        <p className="text-gray-500 dark:text-gray-400 text-xs text-center mt-4">
          {formatString(dict.pagination, {
            start: (currentPage - 1) * itemsPerPage + 1,
            end: Math.min(currentPage * itemsPerPage, posts.length),
            total: posts.length,
          })}
        </p>

        {/* 分页控件 */}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={(page) => setCurrentPage(page)}
        />
      </main>
    </Suspense>
  );
}

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  const dict = useDictionary();

  const getPageItems = () => {
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
      for (let page = Math.max(2, totalPages - 3); page < totalPages; page += 1) {
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
  };

  const changePage = (page: number) => {
    if (page === currentPage || page < 1 || page > totalPages) {
      return;
    }

    onPageChange(page);
  };

  return (
    <nav
      className="flex justify-center items-center gap-2 mt-4"
      aria-label={dict.pagination ?? "Pagination"}
    >
      <button
        type="button"
        onClick={() => changePage(currentPage - 1)}
        disabled={currentPage === 1}
        className="flex justify-center items-center px-4 py-2 w-20 bg-gray-200 dark:bg-[#313131] rounded text-sm disabled:opacity-50"
      >
        {dict.previous}
      </button>

      {getPageItems().map((item, index) => {
        if (item === "ellipsis") {
          return (
            <span key={`ellipsis-${index}`} className="px-2 text-gray-500">
              …
            </span>
          );
        }

        const isActive = currentPage === item;
        return (
          <button
            key={item}
            type="button"
            onClick={() => changePage(item)}
            className={`px-4 py-2 rounded w-12 ${
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
        className="flex justify-center items-center px-4 py-2 w-20 bg-gray-200 dark:bg-[#313131] rounded text-sm disabled:opacity-50"
      >
        {dict.next}
      </button>
    </nav>
  );
}

function List({ posts, useChinese }: { posts: Post[]; useChinese: boolean }) {
  return (
    <ul>
      {posts.map((post, i: number) => {
        const year = getYear(post.date);
        const firstOfYear =
          !posts[i - 1] || getYear(posts[i - 1].date) !== year;
        const lastOfYear =
          !posts[i + 1] || getYear(posts[i + 1].date) !== year;

        return (
          <li key={post.id}>
            <Link href={`/${new Date(post.date).getFullYear()}/${post.id}`}>
              <span
                className={`flex transition-[background-color] hover:bg-gray-100 dark:hover:bg-[#242424] active:bg-gray-200 dark:active:bg-[#222] border-y border-gray-200 dark:border-[#313131]
                ${!firstOfYear ? "border-t-0" : ""}
                ${lastOfYear ? "border-b-0" : ""}
              `}
              >
                <span
                  className={`py-3 flex grow items-center ${
                    !firstOfYear ? "ml-14" : ""
                  }`}
                >
                  {firstOfYear && (
                    <span className="w-14 inline-block self-start shrink-0 text-gray-500 dark:text-gray-500">
                      {year}
                    </span>
                  )}

                  <span className="grow dark:text-gray-100">{useChinese ? post.zh_title : post.title}</span>

                  <span className="text-gray-500 dark:text-gray-500 text-xs">
                    {post.viewsFormatted}
                  </span>
                </span>
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

function getYear(date: string) {
  return new Date(date).getFullYear();
}
