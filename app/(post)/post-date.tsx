import React from "react";
import { formatDistanceToNow } from "date-fns";
import { formatUpdatedDate } from "@/utils/article-dates";

export function PostDate({
  post,
}: {
  post: { date: string; publishedAt: string; updatedAt: string | null };
}) {
  const dateValue = new Date(post.publishedAt);
  const relative = formatDistanceToNow(dateValue, { addSuffix: true });

  return (
    <>
      {post.date} ({relative})
      {post.updatedAt ? (
        <>
          <span className="mx-2" aria-hidden="true">
            |
          </span>
          <time dateTime={post.updatedAt}>
            Updated {formatUpdatedDate(post.updatedAt)}
          </time>
        </>
      ) : null}
    </>
  );
}
