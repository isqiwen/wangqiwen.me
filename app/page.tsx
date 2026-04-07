import { getLanguageFromCookies } from '@/utils/server/get-language';
import { Posts } from "./posts";
import { getPosts } from "./get-posts";

export const revalidate = 60;

export default async function Home() {
  const language = await getLanguageFromCookies();
  const posts = await getPosts(language);

  return <Posts posts={posts} language={language} />;
}
