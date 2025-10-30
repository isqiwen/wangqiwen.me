import { Redis } from "@upstash/redis";

process.env.UPSTASH_REDIS_REST_URL = process.env.UPSTASH_REDIS_REST_URL;
process.env.UPSTASH_REDIS_REST_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

const redis = Redis.fromEnv();

export default redis;
