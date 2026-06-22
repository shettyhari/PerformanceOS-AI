import { Queue } from "bullmq";
import Redis from "ioredis";

// Resolve Redis connection options. Defaulting to local Redis server.
const REDIS_URL = process.env.REDIS_URL || "redis://127.0.0.1:6379";

export const redisConnection = new Redis(REDIS_URL, {
  maxRetriesPerRequest: null, // Critical requirement for BullMQ workers
});

export const syncQueue = new Queue("windsor-sync", {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 10000, // 10 seconds retry delay
    },
    removeOnComplete: 100, // keep last 100 logs
    removeOnFail: 500,     // keep last 500 error logs
  },
});
