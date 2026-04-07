import { Header } from "./header";
import { getPosts } from "../get-posts";
import { getLanguageFromCookies } from "@/utils/server/get-language";
import { canPreviewDrafts } from "@/utils/server/editor-auth";

export const revalidate = 60;

export default async function Layout({ children }) {
  const language = await getLanguageFromCookies();
  const posts = await getPosts(language, {
    includeDrafts: await canPreviewDrafts(),
  });

  return (
    <article className="text-gray-800 dark:text-gray-300 mb-10">
      <Header posts={posts} language={language} />

      {children}
    </article>
  );
}
