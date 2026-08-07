import topicDefinitions from "@/content/topics.json";

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

export type TopicDefinition = {
  name: string;
  slug: string;
};

export type RelatedPost<T extends TopicPost> = {
  post: T;
  sharedTags: string[];
};

export const TOPIC_DEFINITIONS = topicDefinitions as TopicDefinition[];

const topicsByName = new Map(
  TOPIC_DEFINITIONS.map(topic => [topic.name, topic])
);

export function getTopicDefinition(value: string): TopicDefinition | null {
  return topicsByName.get(value.trim()) ?? null;
}

export function isKnownTopic(value: string): boolean {
  return getTopicDefinition(value) !== null;
}

export function getUnknownTopics(tags: string[]): string[] {
  return [...new Set(tags.filter(tag => !isKnownTopic(tag)))];
}

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
    for (const topic of getUniqueTopics(post.tags)) {
      const { slug } = topic;

      const existing = topics.get(slug);
      if (existing) {
        existing.count += 1;
      } else {
        topics.set(slug, { name: topic.name, slug, count: 1 });
      }
    }
  }

  return [...topics.values()].sort(
    (a, b) => b.count - a.count || a.name.localeCompare(b.name)
  );
}

export function getPostsForTopic<T extends TopicPost>(
  posts: T[],
  slug: string
): T[] {
  return posts.filter(post =>
    post.tags.some(tag => getTopicDefinition(tag)?.slug === slug)
  );
}

export function getRelatedPosts<T extends TopicPost>(
  currentPost: T,
  posts: T[],
  limit = 3
): RelatedPost<T>[] {
  const currentTags = new Map(
    getUniqueTopics(currentPost.tags).map(topic => [topic.slug, topic.name])
  );

  return posts
    .filter(post => post.id !== currentPost.id)
    .map(post => {
      const sharedTags = getUniqueTopics(post.tags).flatMap(topic => {
        const currentTag = currentTags.get(topic.slug);
        return currentTag ? [currentTag] : [];
      });
      const sharesSeries = Boolean(
        currentPost.series && post.series && currentPost.series === post.series
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
        new Date(b.post.publishedAt).getTime() -
          new Date(a.post.publishedAt).getTime() ||
        a.post.id.localeCompare(b.post.id)
    )
    .slice(0, limit)
    .map(({ post, sharedTags }) => ({ post, sharedTags }));
}

function getUniqueTopics(tags: string[]): TopicDefinition[] {
  const uniqueTopics = new Map<string, TopicDefinition>();

  for (const tag of tags) {
    const topic = getTopicDefinition(tag);
    if (topic && !uniqueTopics.has(topic.slug)) {
      uniqueTopics.set(topic.slug, topic);
    }
  }

  return [...uniqueTopics.values()];
}
