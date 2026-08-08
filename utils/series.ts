import seriesDefinitions from "@/content/series.json";

export type SeriesDefinition = {
  slug: string;
  title: string;
  description: string;
};

export type SeriesPost = {
  id: string;
  publishedAt: string;
  series: string | null;
  seriesOrder: number | null;
};

export type Series = SeriesDefinition & {
  count: number;
};

export type SeriesContext<T extends SeriesPost> = {
  definition: SeriesDefinition;
  posts: T[];
  position: number;
  previous: T | null;
  next: T | null;
};

export const SERIES_DEFINITIONS = seriesDefinitions as SeriesDefinition[];

const seriesBySlug = new Map(
  SERIES_DEFINITIONS.map(series => [series.slug, series])
);

export function getSeriesDefinition(value: string): SeriesDefinition | null {
  return seriesBySlug.get(value.trim()) ?? null;
}

export function isKnownSeries(value: string): boolean {
  return getSeriesDefinition(value) !== null;
}

export function getSeries<T extends SeriesPost>(posts: T[]): Series[] {
  const counts = new Map<string, number>();

  for (const post of posts) {
    if (!post.series || !getSeriesDefinition(post.series)) {
      continue;
    }

    counts.set(post.series, (counts.get(post.series) ?? 0) + 1);
  }

  return SERIES_DEFINITIONS.flatMap(definition => {
    const count = counts.get(definition.slug) ?? 0;
    return count > 0 ? [{ ...definition, count }] : [];
  });
}

export function getPostsForSeries<T extends SeriesPost>(
  posts: T[],
  slug: string
): T[] {
  return posts.filter(post => post.series === slug).sort(compareSeriesPosts);
}

export function getSeriesContext<T extends SeriesPost>(
  currentPost: T,
  posts: T[]
): SeriesContext<T> | null {
  if (!currentPost.series) {
    return null;
  }

  const definition = getSeriesDefinition(currentPost.series);
  if (!definition) {
    return null;
  }

  const seriesPosts = getPostsForSeries(posts, definition.slug);
  const index = seriesPosts.findIndex(post => post.id === currentPost.id);
  if (index === -1) {
    return null;
  }

  return {
    definition,
    posts: seriesPosts,
    position: index + 1,
    previous: seriesPosts[index - 1] ?? null,
    next: seriesPosts[index + 1] ?? null,
  };
}

function compareSeriesPosts(left: SeriesPost, right: SeriesPost): number {
  const leftOrder = left.seriesOrder ?? Number.MAX_SAFE_INTEGER;
  const rightOrder = right.seriesOrder ?? Number.MAX_SAFE_INTEGER;

  return (
    leftOrder - rightOrder ||
    left.publishedAt.localeCompare(right.publishedAt) ||
    left.id.localeCompare(right.id)
  );
}
