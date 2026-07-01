import { prisma } from "../lib/prisma";

/**
 * Audits campaign metrics to identify performance drops, spending anomalies, or efficiency leaks.
 */
export async function checkPerformanceAnomalies(orgId: string) {
  try {
    // 1. Fetch campaigns and recent daily stats
    const campaigns = await prisma.campaign.findMany({
      where: { adAccount: { orgId } },
      include: {
        metrics: {
          orderBy: { date: "desc" },
          take: 2
        }
      }
    });

    const newAlerts = [];

    for (const camp of campaigns) {
      // Need at least 2 days of metrics to compare change trends
      if (camp.metrics.length < 2) continue;

      const latest = camp.metrics[0];
      const previous = camp.metrics[1];

      const latestSpend = Number(latest.spend);
      const latestRevenue = Number(latest.revenue);
      const latestRoas = latestSpend > 0 ? latestRevenue / latestSpend : 0;

      const prevSpend = Number(previous.spend);
      const prevRevenue = Number(previous.revenue);
      const prevRoas = prevSpend > 0 ? prevRevenue / prevSpend : 0;

      // Rule A: ROAS drop threshold detection
      if (prevRoas >= 1.5 && latestRoas < 1.0) {
        // Verify if a similar alert is already active
        const existing = await prisma.alert.findFirst({
          where: {
            orgId,
            type: "ROAS_DROP",
            message: { contains: camp.name },
            isResolved: false
          }
        });

        if (!existing) {
          const alert = await prisma.alert.create({
            data: {
              orgId,
              type: "ROAS_DROP",
              severity: "CRITICAL",
              message: `Campaign "${camp.name}" encountered a critical ROAS drop from ${prevRoas.toFixed(2)}x to ${latestRoas.toFixed(2)}x.`
            }
          });
          newAlerts.push(alert);
        }
      }

      // Rule B: Cost per Acquisition (CPA) spikes
      const latestConversions = latest.conversions;
      const prevConversions = previous.conversions;

      const latestCpa = latestConversions > 0 ? latestSpend / latestConversions : 0;
      const prevCpa = prevConversions > 0 ? prevSpend / prevConversions : 0;

      if (prevCpa > 0 && latestCpa > prevCpa * 1.5) {
        const existing = await prisma.alert.findFirst({
          where: {
            orgId,
            type: "CPA_SPIKE",
            message: { contains: camp.name },
            isResolved: false
          }
        });

        if (!existing) {
          const alert = await prisma.alert.create({
            data: {
              orgId,
              type: "CPA_SPIKE",
              severity: "WARNING",
              message: `Cost-per-Acquisition (CPA) for campaign "${camp.name}" spiked by 50%+ to $${latestCpa.toFixed(2)} (was $${prevCpa.toFixed(2)}).`
            }
          });
          newAlerts.push(alert);
        }
      }
    }

    return { success: true, alertsCount: newAlerts.length, alerts: newAlerts };
  } catch (err: any) {
    console.error("Alert detection engine failed:", err);
    throw err;
  }
}
