import { type ReactNode, Suspense } from "react";
import { fetchTweet, type Tweet } from "react-tweet/api";

import {
  EmbeddedTweet,
  TweetNotFound,
  TweetSkeleton,
  type TweetProps,
} from "react-tweet";
import redis from "@/app/redis";
import { Caption } from "./caption";
import { logger } from "@/utils/logger";
import "./tweet.css";

interface TweetArgs {
  id: string;
  caption: ReactNode;
}

async function getAndCacheTweet(id: string): Promise<Tweet | undefined> {
  // `getTweet` logs tombstones with console.error. Read the raw result instead
  // so private or deleted embeds can quietly use the unavailable fallback.
  const result = await fetchTweet(id).catch(() => undefined);
  const tweet = result?.data;

  if (tweet) {
    // we populate the cache if we have a fresh tweet
    try {
      await redis.set(`tweet:${id}`, tweet);
    } catch (error) {
      logger.warn("tweet cache write error", error);
    }
    return tweet;
  }

  // Do not render a previously cached copy when an author has deleted or made
  // a tweet private. Only network failures may fall back to a cached copy.
  if (result?.tombstone || result?.notFound) {
    return undefined;
  }

  try {
    const cached = await redis.get(`tweet:${id}`);
    const cachedTweet = (cached ?? null) as Tweet | null;

    if (!cachedTweet) return undefined;

    return cachedTweet;
  } catch (error) {
    logger.warn("tweet cache read error", error);
    return undefined;
  }
}

const TweetContent = async ({ id, components }: TweetProps) => {
  const tweet = id ? await getAndCacheTweet(id) : undefined;

  if (!tweet) {
    return <TweetNotFound />;
  }

  return <EmbeddedTweet tweet={tweet} components={components} />;
};

export const ReactTweet = (props: TweetProps) => (
  <Suspense fallback={<TweetSkeleton />}>
    {/* @ts-ignore: Async components are valid in the app directory */}
    <TweetContent {...props} />
  </Suspense>
);

export async function Tweet({ id, caption }: TweetArgs) {
  return (
    <div className="tweet my-6">
      <div className={`flex justify-center`}>
        <ReactTweet id={id} />
      </div>
      {caption && <Caption>{caption}</Caption>}
    </div>
  );
}
