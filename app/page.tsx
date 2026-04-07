import { getLanguageFromCookies } from '@/utils/server/get-language';
import { Posts } from "./posts";
import { getPosts } from "./get-posts";
import { HomeHero } from "./home-hero";

export const revalidate = 60;

export default async function Home() {
  const language = await getLanguageFromCookies();
  const posts = await getPosts(language);

  return (
    <>
      <HomeHero language={language} />
      <Posts posts={posts} language={language} />
    </>
  );
}
