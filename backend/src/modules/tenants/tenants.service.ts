import { eq } from "drizzle-orm";
import { db } from "../../config/database.js";
import { tenants } from "../../config/schema.js";
import { AppError } from "../../middleware/errorHandler.js";
import type { CreateTenantInput, UpdateTenantInput } from "./tenants.schema.js";

export async function listTenants() {
  return db.query.tenants.findMany({
    columns: {
      id: true,
      name: true,
      isSuspended: true,
      pricePerKwh: true,
      vatRate: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: (tenants, { asc }) => [asc(tenants.name)],
  });
}

export async function getTenantById(id: string) {
  const tenant = await db.query.tenants.findFirst({
    where: eq(tenants.id, id),
  });

  if (!tenant) {
    throw new AppError(404, "Tenant not found");
  }

  return tenant;
}

export async function createTenant(input: CreateTenantInput) {
  const [tenant] = await db
    .insert(tenants)
    .values({
      name: input.name,
    })
    .returning();

  return tenant;
}

export async function updateTenant(id: string, input: UpdateTenantInput) {
  const updateData: Record<string, unknown> = { updatedAt: new Date() };
  if (input.name !== undefined) updateData.name = input.name;
  if (input.isSuspended !== undefined) updateData.isSuspended = input.isSuspended;
  if (input.pricePerKwh !== undefined)
    updateData.pricePerKwh = input.pricePerKwh.toString();
  if (input.vatRate !== undefined)
    updateData.vatRate = input.vatRate.toString();

  const [updated] = await db
    .update(tenants)
    .set(updateData)
    .where(eq(tenants.id, id))
    .returning();

  if (!updated) {
    throw new AppError(404, "Tenant not found");
  }

  return updated;
}

/**
 * Tenant'ı siler. Veritabanı FK cascade sayesinde bu tenant'a bağlı
 * tüm kayıtlar da silinir: users, charge_points, transactions.
 */
export async function deleteTenant(id: string) {
  const [deleted] = await db
    .delete(tenants)
    .where(eq(tenants.id, id))
    .returning({ id: tenants.id, name: tenants.name });

  if (!deleted) {
    throw new AppError(404, "Tenant not found");
  }

  return deleted;
}
