import { Worker } from "bullmq";
import { redisConnection } from "../lib/queue";
import { runWindsorSync } from "../services/sync-service";

console.log("Initializing PerformanceOS AI Background Worker...");

const worker = new Worker(
  "windsor-sync",
  async (job) => {
    const { orgId, daysLookback } = job.data;
    console.log(`[Job ${job.id}] Executing sync for Org: ${orgId}`);
    
    const result = await runWindsorSync(orgId, daysLookback || 30);
    
    return result;
  },
  {
    connection: redisConnection,
    concurrency: 4, // Max concurrent sync pipelines
  }
);

worker.on("completed", (job) => {
  console.log(`[Job ${job.id}] Success. Completed task.`);
});

worker.on("failed", (job, err) => {
  console.error(`[Job ${job?.id}] Failed with error:`, err.message);
});

export default worker;
