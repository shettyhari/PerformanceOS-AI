import { pgTable, text, timestamp, boolean, integer, real, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const roleEnum = pgEnum("role", ["OWNER", "ADMIN", "MEMBER"]);
export const syncStatusEnum = pgEnum("sync_status", ["PENDING", "SYNCING", "SYNCED", "FAILED"]);
export const alertSeverityEnum = pgEnum("alert_severity", ["WARNING", "CRITICAL"]);

export const organizationsTable = pgTable("organizations", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const usersTable = pgTable("users", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: text("name").notNull(),
  orgId: text("org_id").notNull().references(() => organizationsTable.id),
  role: roleEnum("role").notNull().default("OWNER"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const windsorConnectionsTable = pgTable("windsor_connections", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  orgId: text("org_id").notNull().unique().references(() => organizationsTable.id),
  apiKeyEncrypted: text("api_key_encrypted").notNull(),
  syncStatus: syncStatusEnum("sync_status").notNull().default("PENDING"),
  lastSyncAt: timestamp("last_sync_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const syncLogsTable = pgTable("sync_logs", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  connectionId: text("connection_id").notNull().references(() => windsorConnectionsTable.id),
  status: text("status").notNull(),
  errorMessage: text("error_message"),
  rowsSynced: integer("rows_synced").notNull().default(0),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
});

export const campaignMetricsTable = pgTable("campaign_metrics", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  orgId: text("org_id").notNull().references(() => organizationsTable.id),
  campaignId: text("campaign_id").notNull(),
  name: text("name").notNull(),
  platform: text("platform").notNull(),
  date: text("date").notNull(),
  spend: real("spend").notNull().default(0),
  revenue: real("revenue").notNull().default(0),
  impressions: integer("impressions").notNull().default(0),
  clicks: integer("clicks").notNull().default(0),
  conversions: integer("conversions").notNull().default(0),
  leads: integer("leads").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const alertsTable = pgTable("alerts", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  orgId: text("org_id").notNull().references(() => organizationsTable.id),
  type: text("type").notNull(),
  severity: alertSeverityEnum("severity").notNull().default("WARNING"),
  message: text("message").notNull(),
  isResolved: boolean("is_resolved").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const conversationsTable = pgTable("conversations", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  orgId: text("org_id").notNull().references(() => organizationsTable.id),
  userId: text("user_id").notNull().references(() => usersTable.id),
  title: text("title").notNull().default("New Conversation"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const messagesTable = pgTable("messages", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  conversationId: text("conversation_id").notNull().references(() => conversationsTable.id),
  role: text("role").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(usersTable).omit({ id: true, createdAt: true });
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof usersTable.$inferSelect;
export type Organization = typeof organizationsTable.$inferSelect;
export type WindsorConnection = typeof windsorConnectionsTable.$inferSelect;
export type Alert = typeof alertsTable.$inferSelect;
export type CampaignMetric = typeof campaignMetricsTable.$inferSelect;
export type Conversation = typeof conversationsTable.$inferSelect;
export type Message = typeof messagesTable.$inferSelect;
