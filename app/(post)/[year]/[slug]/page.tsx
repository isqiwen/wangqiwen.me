import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPostByRoute, getPosts } from "@/app/get-posts";
import { getSiteUrl } from "@/utils/site-config";
import { canPreviewDrafts } from "@/utils/server/local-editor";
import { getArticleComponent } from "../../post-registry";

export const revalidate = 60;
export const dynamicParams = false;

type ArticlePageProps = {
  params: Promise<{
    year: string;
    slug: string;
  }>;
};

export async function generateStaticParams() {
  const posts = await getPosts({ includeViews: false });

  return posts.map(post => ({
    year: post.publishedAt.slice(0, 4),
    slug: post.id,
  }));
}

export async function generateMetadata({
  params,
}: ArticlePageProps): Promise<Metadata> {
  const { year, slug } = await params;
  const post = await getPostByRoute(year, slug, { includeViews: false });

  if (!post) {
    return {};
  }

  const url = getSiteUrl(`/${year}/${slug}`);
  return {
    title: post.title,
    description: post.description,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      title: post.title,
      description: post.description,
      url,
      publishedTime: post.publishedAt,
      modifiedTime: post.updatedAt ?? undefined,
    },
  };
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { year, slug } = await params;
  const post = await getPostByRoute(year, slug, {
    includeDrafts: canPreviewDrafts(),
    includeViews: false,
  });
  const Article = getArticleComponent(year, slug);

  if (!post || !Article) {
    notFound();
  }

  return <Article />;
}
