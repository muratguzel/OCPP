import Redis from "ioredis";
import { env } from "./env.js";

// ioredis typings expose a namespace; in ESM the default import is the constructor at runtime
export const redis = new (Redis as unknown as new (
  url: string,
  options?: { maxRetriesPerRequest?: number; lazyConnect?: boolean }
) => import("ioredis").Redis)(env.REDIS_URL, {
  maxRetriesPerRequest: 3,
  lazyConnect: true,
});

redis.on("error", (err: Error) => {
  console.error("Redis connection error:", err.message);
});

redis.on("connect", () => {
  console.log("Redis connected");
});
