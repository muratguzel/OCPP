import { z } from "zod";

export const createUserSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().min(1, "Name is required").max(255),
  role: z.enum(["admin", "user"]).default("user"),
  tenantId: z.string().uuid().optional(),
  numaraTaj: z.string().min(1, "Numarataj is required").max(255),
  phone: z.string().min(1, "Phone number is required").max(50),
});

export const updateUserSchema = z.object({
  email: z.string().email("Invalid email address").optional(),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .optional(),
  name: z.string().min(1).max(255).optional(),
  role: z.enum(["admin", "user"]).optional(),
  isActive: z.boolean().optional(),
  numaraTaj: z.string().min(1).max(255).optional(),
  phone: z.string().min(1).max(50).optional(),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
