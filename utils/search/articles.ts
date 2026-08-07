export type SearchableArticle = {
  id: string;
  title: string;
  description: string;
  summary: string;
  tags: string[];
  publishedAt: string;
};

type ScoredArticle = SearchableArticle & {
  score: number;
};

export function searchArticles(
  articles: SearchableArticle[],
  query: string,
): SearchableArticle[] {
  const terms = normalize(query)
    .split(/\s+/)
    .filter(Boolean);

  if (terms.length === 0) {
    return [...articles].sort(sortByDate);
  }

  return articles
    .map(article => scoreArticle(article, terms))
    .filter((article): article is ScoredArticle => article !== null)
    .sort((a, b) => b.score - a.score || sortByDate(a, b))
    .map(({ score: _score, ...article }) => article);
}

function scoreArticle(article: SearchableArticle, terms: string[]): ScoredArticle | null {
  const title = normalize(article.title);
  const description = normalize(article.description);
  const summary = normalize(article.summary);
  const tags = article.tags.map(normalize);
  const searchableText = [title, description, summary, ...tags].join(" ");

  if (!terms.every(term => searchableText.includes(term))) {
    return null;
  }

  const score = terms.reduce((total, term) => {
    if (title.startsWith(term)) return total + 12;
    if (title.includes(term)) return total + 8;
    if (tags.some(tag => tag.includes(term))) return total + 6;
    if (description.includes(term) || summary.includes(term)) return total + 3;
    return total + 1;
  }, 0);

  return { ...article, score };
}

function sortByDate(a: SearchableArticle, b: SearchableArticle): number {
  return Date.parse(b.publishedAt) - Date.parse(a.publishedAt);
}

function normalize(value: string): string {
  return value.toLocaleLowerCase().trim();
}
