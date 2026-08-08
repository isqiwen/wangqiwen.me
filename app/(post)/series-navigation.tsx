"use client";

import Link from "next/link";
import { useSelectedLayoutSegments } from "next/navigation";
import type { Post } from "@/app/get-posts";
import { getSeriesContext } from "@/utils/series";

export function SeriesNavigation({ posts }: { posts: Post[] }) {
  const segments = useSelectedLayoutSegments();
  const currentPost = posts.find(
    post => post.id === segments[segments.length - 1]
  );
  const context = currentPost ? getSeriesContext(currentPost, posts) : null;

  if (!context) {
    return null;
  }

  return (
    <section
      className="mt-12 border-t border-gray-200 pt-7 dark:border-[#303030]"
      aria-label="Series navigation"
    >
      <p className="font-mono text-xs text-gray-500 dark:text-gray-400">
        <Link
          href={`/series/${context.definition.slug}`}
          className="text-gray-700 underline-offset-4 hover:underline dark:text-gray-200"
        >
          {context.definition.title}
        </Link>
        <span aria-hidden="true"> · </span>
        Part {context.position} of {context.posts.length}
      </p>

      <nav className="mt-4 grid gap-3 sm:grid-cols-2">
        {context.previous ? (
          <SeriesLink label="Previous" post={context.previous} />
        ) : (
          <span />
        )}
        {context.next ? (
          <SeriesLink label="Next" post={context.next} align="right" />
        ) : null}
      </nav>
    </section>
  );
}

function SeriesLink({
  label,
  post,
  align = "left",
}: {
  label: "Previous" | "Next";
  post: Post;
  align?: "left" | "right";
}) {
  return (
    <Link
      href={`/${post.publishedAt.slice(0, 4)}/${post.id}`}
      className={`rounded-md border border-gray-200 px-4 py-3 text-sm transition-colors hover:bg-gray-100 focus:bg-gray-100 focus:outline-none dark:border-[#3d3d3d] dark:hover:bg-[#303030] dark:focus:bg-[#303030] ${
        align === "right" ? "sm:text-right" : ""
      }`}
    >
      <span className="block font-mono text-xs text-gray-500 dark:text-gray-400">
        {label}
      </span>
      <span className="mt-1 block font-medium text-gray-900 dark:text-gray-100">
        {post.title}
      </span>
    </Link>
  );
}
