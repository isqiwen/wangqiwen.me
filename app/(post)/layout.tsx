import { Header } from "./header";
import { getPosts } from "../get-posts";
import { canPreviewDrafts } from "@/utils/server/editor-auth";
import { EquationNumbering } from "./components/equation-numbering";

export const revalidate = 60;

export default async function Layout({ children }) {
  const posts = await getPosts({
    includeDrafts: await canPreviewDrafts(),
  });

  return (
    <article
      className="mb-10 text-gray-800 dark:text-gray-300"
      data-equation-root="true"
    >
      <EquationNumbering />
      <Header posts={posts} />

      {children}
    </article>
  );
}
