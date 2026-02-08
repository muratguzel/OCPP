import { z } from "zod";

export const createChargePointSchema = z.object({
  tenantId: z.string().uuid("Invalid tenant id"),
  chargePointId: z.string().min(1, "Charge point id is required").max(255),
  /** OCPP Gateway identity (WebSocket path last segment). Set when 2.x connects as e.g. "2.0.1" so start charge finds this CP. */
  ocppIdentity: z.string().max(255).optional(),
  name: z.string().max(255).optional(),
  connectorType: z.enum(["Type2", "CCS", "CHAdeMO"]).optional(),
  maxPower: z.number().int().positive().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

export const updateChargePointSchema = z.object({
  name: z.string().max(255).optional(),
  isActive: z.boolean().optional(),
  ocppIdentity: z.string().max(255).optional().nullable(),
  connectorType: z.enum(["Type2", "CCS", "CHAdeMO"]).optional(),
  maxPower: z.number().int().positive().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

export type CreateChargePointInput = z.infer<typeof createChargePointSchema>;
export type UpdateChargePointInput = z.infer<typeof updateChargePointSchema>;
