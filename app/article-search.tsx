"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  searchArticles,
  type SearchableArticle,
} from "@/utils/search/articles";

type ArticleSearchProps = {
  articles: SearchableArticle[];
};

const MAX_RESULTS = 8;

export function ArticleSearch({ articles }: ArticleSearchProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const results = useMemo(
    () => searchArticles(articles, query).slice(0, MAX_RESULTS),
    [articles, query],
  );

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setIsOpen(true);
      }

      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  function close() {
    setIsOpen(false);
    setQuery("");
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-1 rounded-sm p-2 transition-[background-color] hover:bg-gray-200 active:bg-gray-300 dark:hover:bg-[#313131] dark:active:bg-[#242424]"
        aria-label="Search articles"
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        title="Search articles (⌘/Ctrl + K)"
      >
        <SearchIcon />
        <span className="hidden sm:inline">Search</span>
        <kbd className="hidden rounded border border-gray-300 px-1 font-mono text-[10px] text-gray-500 dark:border-[#555] dark:text-gray-400 md:inline">
          ⌘K
        </kbd>
      </button>

      {isOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 px-4 pt-[15vh]"
          onMouseDown={event => {
            if (event.target === event.currentTarget) {
              close();
            }
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-label="Search articles"
            className="w-full max-w-xl overflow-hidden rounded-lg border border-gray-200 bg-white shadow-2xl dark:border-[#3d3d3d] dark:bg-[#1b1b1b]"
          >
            <label htmlFor="article-search" className="sr-only">
              Search articles
            </label>
            <div className="flex items-center border-b border-gray-200 px-3 dark:border-[#3d3d3d]">
              <SearchIcon className="shrink-0 text-gray-500" />
              <input
                ref={inputRef}
                id="article-search"
                value={query}
                onChange={event => setQuery(event.target.value)}
                placeholder="Search articles by title, summary, or tag"
                autoComplete="off"
                spellCheck={false}
                className="h-14 w-full bg-transparent px-3 text-sm outline-none placeholder:text-gray-400 dark:placeholder:text-gray-500"
              />
              <button
                type="button"
                onClick={close}
                className="rounded px-2 py-1 text-xs text-gray-500 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-[#303030]"
              >
                Esc
              </button>
            </div>

            <div className="max-h-[55vh] overflow-y-auto p-2">
              {results.length > 0 ? (
                <ul aria-label="Search results">
                  {results.map(article => (
                    <li key={article.id}>
                      <Link
                        href={`/${article.publishedAt.slice(0, 4)}/${article.id}`}
                        onClick={close}
                        className="block rounded-md px-3 py-3 transition-colors hover:bg-gray-100 focus:bg-gray-100 focus:outline-none dark:hover:bg-[#303030] dark:focus:bg-[#303030]"
                      >
                        <div className="flex items-baseline justify-between gap-4">
                          <span className="font-medium text-gray-900 dark:text-gray-100">
                            {article.title}
                          </span>
                          <time className="shrink-0 text-xs text-gray-500 dark:text-gray-400">
                            {article.publishedAt.slice(0, 4)}
                          </time>
                        </div>
                        {article.summary || article.description ? (
                          <p className="mt-1 line-clamp-2 text-xs leading-5 text-gray-600 dark:text-gray-400">
                            {article.summary || article.description}
                          </p>
                        ) : null}
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="px-3 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                  No matching articles.
                </p>
              )}
            </div>

            <p className="border-t border-gray-200 px-4 py-2 text-xs text-gray-500 dark:border-[#3d3d3d] dark:text-gray-400">
              Search runs locally. Press Esc to close.
            </p>
          </section>
        </div>
      ) : null}
    </>
  );
}

function SearchIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className={className}
    >
      <circle cx="11" cy="11" r="6" />
      <path d="m16 16 4 4" />
    </svg>
  );
}
