import { prisma } from "../lib/prisma";
import { fetchWindsorData } from "../lib/windsor";
import { decrypt } from "../lib/crypto";

export async function runWindsorSync(orgId: string, daysLookback = 30) {
  const syncStartTime = new Date();
  
  // 1. Fetch the active connection
  const connection = await prisma.windsorConnection.findUnique({
    where: { orgId }
  });

  if (!connection) {
    throw new Error("No Windsor Connection found for this organization.");
  }

  // Update status to SYNCING
  await prisma.windsorConnection.update({
    where: { orgId },
    data: { syncStatus: "SYNCING" }
  });

  let totalRows = 0;
  
  try {
    const apiKey = decrypt(connection.apiKeyEncrypted);
    
    // Resolve date range (default last 30 days)
    const dateTo = new Date().toISOString().split("T")[0];
    const dateFrom = new Date(Date.now() - daysLookback * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0];

    // 2. Fetch raw analytics data from Windsor
    const metrics = await fetchWindsorData(apiKey, dateFrom, dateTo);
    totalRows = metrics.length;

    // 3. Process records inside transactions to guarantee integrity
    for (const record of metrics) {
      await prisma.$transaction(async (tx) => {
        // A. Upsert Ad Account
        const adAccount = await tx.adAccount.upsert({
          where: {
            orgId_platform_externalAccountId: {
              orgId,
              platform: record.platform,
              externalAccountId: record.accountExternalId
            }
          },
          update: {
            name: record.accountName,
            isActive: true
          },
          create: {
            orgId,
            platform: record.platform,
            externalAccountId: record.accountExternalId,
            name: record.accountName,
            isActive: true
          }
        });

        // B. Upsert Campaign
        const campaign = await tx.campaign.upsert({
          where: {
            adAccountId_externalCampaignId: {
              adAccountId: adAccount.id,
              externalCampaignId: record.campaignExternalId
            }
          },
          update: {
            name: record.campaignName,
            status: "ACTIVE" // default to active when syncing performance
          },
          create: {
            adAccountId: adAccount.id,
            externalCampaignId: record.campaignExternalId,
            name: record.campaignName,
            status: "ACTIVE"
          }
        });

        // C. Upsert Daily Metric
        await tx.metric.upsert({
          where: {
            campaignId_date: {
              campaignId: campaign.id,
              date: record.date
            }
          },
          update: {
            spend: record.spend,
            revenue: record.revenue,
            impressions: record.impressions,
            clicks: record.clicks,
            conversions: record.conversions,
            leads: record.conversions // mapping leads to conversions if not separate
          },
          create: {
            campaignId: campaign.id,
            date: record.date,
            spend: record.spend,
            revenue: record.revenue,
            impressions: record.impressions,
            clicks: record.clicks,
            conversions: record.conversions,
            leads: record.conversions
          }
        });
      });
    }

    // 4. Update Connection record to SUCCESS
    await prisma.windsorConnection.update({
      where: { orgId },
      data: {
        syncStatus: "SUCCESS",
        lastSyncAt: syncStartTime
      }
    });

    // 5. Write success Sync Log
    await prisma.syncLog.create({
      data: {
        windsorConnectionId: connection.id,
        status: "SUCCESS",
        rowsSynced: totalRows
      }
    });

    return { success: true, rowsSynced: totalRows };
  } catch (err: any) {
    console.error(`Windsor Sync Error for org ${orgId}:`, err);

    // Update Connection record to FAILED
    await prisma.windsorConnection.update({
      where: { orgId },
      data: { syncStatus: "FAILED" }
    });

    // Write failed Sync Log
    await prisma.syncLog.create({
      data: {
        windsorConnectionId: connection.id,
        status: "FAILED",
        errorMessage: err.message || "Unknown synchronization error",
        rowsSynced: 0
      }
    });

    throw err;
  }
}
