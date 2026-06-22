import { syncQueue } from "../lib/queue";
import { prisma } from "../lib/prisma";

console.log("Initializing PerformanceOS AI Cron Scheduler...");

async function enqueueJobs() {
  try {
    const connections = await prisma.windsorConnection.findMany({
      select: { orgId: true }
    });

    console.log(`[Scheduler] Found ${connections.length} active connection(s) to sync.`);

    for (const conn of connections) {
      // Enqueue job into BullMQ
      await syncQueue.add(
        `sync-${conn.orgId}`,
        { orgId: conn.orgId, daysLookback: 15 }, // lookback 15 days on incremental refreshes
        {
          jobId: `sync-${conn.orgId}-${Math.floor(Date.now() / 900000)}` // deduplicate jobs within the same 15-minute bucket
        }
      );
      console.log(`[Scheduler] Enqueued sync job for Org: ${conn.orgId}`);
    }
  } catch (err) {
    console.error("[Scheduler] Error scheduling sync jobs:", err);
  }
}

// Execute immediately on startup
enqueueJobs();

// Setup loop to trigger every 15 minutes (15 * 60 * 1000 ms)
const FIFTEEN_MINUTES = 15 * 60 * 1000;
setInterval(enqueueJobs, FIFTEEN_MINUTES);
