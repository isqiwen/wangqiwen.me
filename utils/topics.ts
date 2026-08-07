export type TopicPost = {
  id: string;
  publishedAt: string;
  series: string | null;
  tags: string[];
};

export type Topic = {
  name: string;
  slug: string;
  count: number;
};

export type RelatedPost<T extends TopicPost> = {
  post: T;
  sharedTags: string[];
};

export function getTopicSlug(topic: string): string {
  return topic
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function getTopics(posts: Pick<TopicPost, "tags">[]): Topic[] {
  const topics = new Map<string, Topic>();

  for (const post of posts) {
    for (const tag of getUniqueTags(post.tags)) {
      const slug = getTopicSlug(tag);
      if (!slug) continue;

      const existing = topics.get(slug);
      if (existing) {
        existing.count += 1;
      } else {
        topics.set(slug, { name: tag, slug, count: 1 });
      }
    }
  }

  return [...topics.values()].sort(
    (a, b) => b.count - a.count || a.name.localeCompare(b.name),
  );
}

export function getPostsForTopic<T extends TopicPost>(posts: T[], slug: string): T[] {
  return posts.filter(post => post.tags.some(tag => getTopicSlug(tag) === slug));
}

export function getRelatedPosts<T extends TopicPost>(
  currentPost: T,
  posts: T[],
  limit = 3,
): RelatedPost<T>[] {
  const currentTags = new Map(
    getUniqueTags(currentPost.tags).map(tag => [getTopicSlug(tag), tag]),
  );

  return posts
    .filter(post => post.id !== currentPost.id)
    .map(post => {
      const sharedTags = getUniqueTags(post.tags).flatMap(tag => {
        const currentTag = currentTags.get(getTopicSlug(tag));
        return currentTag ? [currentTag] : [];
      });
      const sharesSeries = Boolean(
        currentPost.series && post.series && currentPost.series === post.series,
      );

      return {
        post,
        sharedTags,
        score: sharedTags.length * 10 + (sharesSeries ? 6 : 0),
      };
    })
    .filter(item => item.score > 0)
    .sort(
      (a, b) =>
        b.score - a.score ||
        new Date(b.post.publishedAt).getTime() - new Date(a.post.publishedAt).getTime() ||
        a.post.id.localeCompare(b.post.id),
    )
    .slice(0, limit)
    .map(({ post, sharedTags }) => ({ post, sharedTags }));
}

function getUniqueTags(tags: string[]): string[] {
  const uniqueTags = new Map<string, string>();

  for (const tag of tags) {
    const normalized = tag.trim();
    const slug = getTopicSlug(normalized);
    if (slug && !uniqueTags.has(slug)) {
      uniqueTags.set(slug, normalized);
    }
  }

  return [...uniqueTags.values()];
}
