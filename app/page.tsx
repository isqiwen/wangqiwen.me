import { Posts } from "./posts";
import { getPosts } from "./get-posts";

export const dynamic = "force-dynamic";

export default async function Home() {
  const posts = await getPosts();

  return <Posts posts={posts} />;
}
