import { Header } from "./header";
import { getPosts } from "../get-posts";
import { canPreviewDrafts } from "@/utils/server/local-editor";
import { EquationNumbering } from "./components/equation-numbering";
import { TableOfContents } from "./components/table-of-contents";
import { RelatedPosts } from "./related-posts";
import { SeriesNavigation } from "./series-navigation";

export const revalidate = 60;

export default async function Layout({ children }) {
  const posts = await getPosts({
    includeDrafts: canPreviewDrafts(),
  });

  return (
    <div
      className="
        min-[1200px]:relative min-[1200px]:left-1/2 min-[1200px]:grid
        min-[1200px]:w-[calc(100vw-3rem)] min-[1200px]:max-w-7xl
        min-[1200px]:-translate-x-1/2
        min-[1200px]:grid-cols-[minmax(0,1fr)_minmax(0,39rem)_minmax(0,1fr)]
      "
    >
      <TableOfContents />
      <article
        className="mb-10 min-w-0 text-gray-800 dark:text-gray-300 min-[1200px]:col-start-2 min-[1200px]:row-start-1"
        data-equation-root="true"
        data-post-content="true"
      >
        <EquationNumbering />
        <Header posts={posts} />

        <div className="post-prose">{children}</div>
        <SeriesNavigation posts={posts} />
        <RelatedPosts posts={posts} />
      </article>
    </div>
  );
}
