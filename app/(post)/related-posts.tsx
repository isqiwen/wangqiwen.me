"use client";

import Link from "next/link";
import { useSelectedLayoutSegments } from "next/navigation";
import type { Post } from "@/app/get-posts";
import { getRelatedPosts } from "@/utils/topics";

export function RelatedPosts({ posts }: { posts: Post[] }) {
  const segments = useSelectedLayoutSegments();
  const currentPost = posts.find(post => post.id === segments[segments.length - 1]);
  const relatedPosts = currentPost ? getRelatedPosts(currentPost, posts) : [];

  if (relatedPosts.length === 0) {
    return null;
  }

  return (
    <section className="mt-14 border-t border-gray-200 pt-7 dark:border-[#303030]">
      <h2 className="text-lg font-bold dark:text-gray-100">
        Related writing
      </h2>

      <ul className="mt-4 space-y-2">
        {relatedPosts.map(({ post, sharedTags }) => (
          <li key={post.id}>
            <Link
              href={`/${post.publishedAt.slice(0, 4)}/${post.id}`}
              className="block rounded-md border border-gray-200 px-4 py-3 transition-colors hover:bg-gray-100 focus:bg-gray-100 focus:outline-none dark:border-[#3d3d3d] dark:hover:bg-[#303030] dark:focus:bg-[#303030]"
            >
              <div className="flex items-baseline justify-between gap-4">
                <h3 className="font-medium text-gray-900 dark:text-gray-100">{post.title}</h3>
                <time className="shrink-0 font-mono text-xs text-gray-500 dark:text-gray-400">
                  {post.publishedAt.slice(0, 4)}
                </time>
              </div>

              {post.summary || post.description ? (
                <p className="mt-1 line-clamp-2 text-sm leading-6 text-gray-600 dark:text-gray-400">
                  {post.summary || post.description}
                </p>
              ) : null}

              {sharedTags.length > 0 ? (
                <p className="mt-2 font-mono text-xs text-gray-500 dark:text-gray-400">
                  {sharedTags.join(" · ")}
                </p>
              ) : null}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
