import { z } from "zod";

export const createTenantSchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
});

export const updateTenantSchema = z.object({
  name: z.string().min(1, "Name is required").max(255).optional(),
  isSuspended: z.boolean().optional(),
  pricePerKwh: z.number().min(0).optional(),
  vatRate: z.number().min(0).max(100).optional(),
});

export type CreateTenantInput = z.infer<typeof createTenantSchema>;
export type UpdateTenantInput = z.infer<typeof updateTenantSchema>;
