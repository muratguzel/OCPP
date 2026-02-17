import { z } from "zod";

export const startChargeSchema = z.object({
  chargePointId: z.string().min(1, "Charge point id is required").max(255),
  connectorId: z.number().int().positive().optional().default(1),
});

export const webhookTransactionStartedSchema = z.object({
  chargePointId: z.string().min(1),
  transactionId: z.union([z.number(), z.string()]),
  connectorId: z.number().int().positive(),
  idTag: z.string().default('unknown'),
  meterStart: z.number().int().optional(),
  startTime: z.string().optional(),
});

export const webhookTransactionStoppedSchema = z.object({
  chargePointId: z.string().min(1),
  transactionId: z.union([z.number(), z.string()]),
  meterStop: z.number().optional(),
  endTime: z.string().optional(),
});

export const getPriceQuerySchema = z.object({
  chargePointId: z.string().min(1, "Charge point id is required").max(255),
});

export type StartChargeInput = z.infer<typeof startChargeSchema>;
export type WebhookTransactionStartedInput = z.infer<
  typeof webhookTransactionStartedSchema
>;
export type WebhookTransactionStoppedInput = z.infer<
  typeof webhookTransactionStoppedSchema
>;
export type GetPriceQuery = z.infer<typeof getPriceQuerySchema>;