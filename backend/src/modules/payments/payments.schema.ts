import { z } from "zod";

export const paymentsSummarySchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)"),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)"),
  tenantId: z.string().uuid().optional(),
  userId: z.string().uuid().optional(),
  numaraTaj: z.string().max(255).optional(),
});

export type PaymentsSummaryInput = z.infer<typeof paymentsSummarySchema>;
