import { z } from "zod";

export const createChargePointSchema = z.object({
  tenantId: z.string().uuid("Invalid tenant id"),
  chargePointId: z.string().min(1, "Charge point id is required").max(255),
  name: z.string().max(255).optional(),
});

export const updateChargePointSchema = z.object({
  name: z.string().max(255).optional(),
  isActive: z.boolean().optional(),
});

export type CreateChargePointInput = z.infer<typeof createChargePointSchema>;
export type UpdateChargePointInput = z.infer<typeof updateChargePointSchema>;
