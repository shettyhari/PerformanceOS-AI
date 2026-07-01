import { z } from 'zod';
import { WINDSOR_MARKETING_CONNECTORS } from '@/features/windsor/types';

export const windsorConnectionConfigSchema = z.object({
  connectors: z
    .array(z.enum(WINDSOR_MARKETING_CONNECTORS))
    .min(1)
    .default([...WINDSOR_MARKETING_CONNECTORS]),
  datePreset: z.string().min(1).default('last_30d'),
  dateFrom: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  dateTo: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
});

export const createWindsorConnectionSchema = z.object({
  name: z.string().min(2).max(100),
  apiKey: z.string().min(8).max(512),
  workspaceId: z.string().max(100).optional(),
  syncIntervalMin: z.coerce.number().int().min(15).max(1440).default(60),
  autoSyncEnabled: z.coerce.boolean().default(true),
  config: windsorConnectionConfigSchema.optional(),
});

export const updateWindsorConnectionSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  workspaceId: z.string().max(100).nullable().optional(),
  syncIntervalMin: z.coerce.number().int().min(15).max(1440).optional(),
  autoSyncEnabled: z.coerce.boolean().optional(),
  isActive: z.coerce.boolean().optional(),
  config: windsorConnectionConfigSchema.optional(),
});

export const validateWindsorApiKeySchema = z.object({
  apiKey: z.string().min(8).max(512),
});

export type CreateWindsorConnectionInput = z.infer<
  typeof createWindsorConnectionSchema
>;
export type UpdateWindsorConnectionInput = z.infer<
  typeof updateWindsorConnectionSchema
>;
