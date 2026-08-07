import Link from "next/link";
import type { Post } from "./get-posts";

export function PostList({ posts }: { posts: Post[] }) {
  return (
    <ul data-post-list="chronological">
      {posts.map((post, index) => {
        const year = getYear(post.publishedAt);
        const previousYear = posts[index - 1]
          ? getYear(posts[index - 1].publishedAt)
          : null;
        const nextYear = posts[index + 1]
          ? getYear(posts[index + 1].publishedAt)
          : null;
        const firstOfYear = previousYear !== year;
        const lastOfYear = nextYear !== year;

        return (
          <li key={post.id}>
            <Link href={`/${year}/${post.id}`}>
              <span
                className={`flex border-y border-gray-200 transition-[background-color] hover:bg-gray-100 active:bg-gray-200 dark:border-[#313131] dark:hover:bg-[#242424] dark:active:bg-[#222]
                ${!firstOfYear ? "border-t-0" : ""}
                ${lastOfYear ? "border-b-0" : ""}
              `}
              >
                <span
                  className={`flex grow items-center py-3 ${
                    !firstOfYear ? "ml-14" : ""
                  }`}
                >
                  {firstOfYear && (
                    <span className="inline-block w-14 shrink-0 self-start text-gray-500 dark:text-gray-500">
                      {year}
                    </span>
                  )}

                  <span className="grow dark:text-gray-100">{post.title}</span>

                  <span className="text-xs text-gray-500 dark:text-gray-500">
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
