import { Header } from "./header";
import { getPosts } from "../get-posts";
import { getLanguageFromCookies } from '@/utils/get-language';

export const revalidate = 60;

export default async function Layout({ children }) {
  const posts = await getPosts();
  const language = await getLanguageFromCookies();

  return (
    <article className="text-gray-800 dark:text-gray-300 mb-10">
      <Header posts={posts} language={language} />

      {children}
    </article>
  );
}
