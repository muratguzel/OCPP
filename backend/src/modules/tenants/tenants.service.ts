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
  const [updated] = await db
    .update(tenants)
    .set({
      name: input.name,
      updatedAt: new Date(),
    })
    .where(eq(tenants.id, id))
    .returning();

  if (!updated) {
    throw new AppError(404, "Tenant not found");
  }

  return updated;
}

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
