import { eq } from "drizzle-orm";
import { db } from "../../config/database.js";
import { chargePoints, tenants } from "../../config/schema.js";
import { AppError } from "../../middleware/errorHandler.js";
import type {
  CreateChargePointInput,
  UpdateChargePointInput,
} from "./charge-points.schema.js";

type Role = "super_admin" | "admin" | "user";

const listColumns = {
  id: true,
  tenantId: true,
  chargePointId: true,
  name: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
};

export async function listChargePoints(
  requesterRole: Role,
  requesterTenantId: string | undefined,
  filterTenantId?: string
) {
  if (requesterRole === "super_admin") {
    const conditions = filterTenantId
      ? eq(chargePoints.tenantId, filterTenantId)
      : undefined;
    return db.query.chargePoints.findMany({
      where: conditions,
      columns: listColumns,
      orderBy: (chargePoints, { asc }) => [asc(chargePoints.chargePointId)],
    });
  }

  if (requesterRole === "admin" && requesterTenantId) {
    return db.query.chargePoints.findMany({
      where: eq(chargePoints.tenantId, requesterTenantId),
      columns: listColumns,
      orderBy: (chargePoints, { asc }) => [asc(chargePoints.chargePointId)],
    });
  }

  throw new AppError(403, "Insufficient permissions");
}

export async function getChargePointById(
  id: string,
  requesterRole: Role,
  requesterTenantId: string | undefined
) {
  const cp = await db.query.chargePoints.findFirst({
    where: eq(chargePoints.id, id),
  });

  if (!cp) {
    throw new AppError(404, "Charge point not found");
  }

  if (requesterRole === "admin" && cp.tenantId !== requesterTenantId) {
    throw new AppError(403, "Insufficient permissions");
  }

  return cp;
}

export async function createChargePoint(
  input: CreateChargePointInput,
  requesterRole: Role,
  requesterTenantId: string | undefined
) {
  if (requesterRole === "admin") {
    if (input.tenantId !== requesterTenantId) {
      throw new AppError(403, "Admins can only create charge points for their own tenant");
    }
  }

  const tenant = await db.query.tenants.findFirst({
    where: eq(tenants.id, input.tenantId),
  });
  if (!tenant) {
    throw new AppError(404, "Tenant not found");
  }

  const existing = await db.query.chargePoints.findFirst({
    where: eq(chargePoints.chargePointId, input.chargePointId),
  });
  if (existing) {
    throw new AppError(409, "Charge point id already in use");
  }

  const [created] = await db
    .insert(chargePoints)
    .values({
      tenantId: input.tenantId,
      chargePointId: input.chargePointId,
      name: input.name ?? null,
    })
    .returning();

  if (!created) throw new AppError(500, "Failed to create charge point");
  return created;
}

export async function updateChargePoint(
  id: string,
  input: UpdateChargePointInput,
  requesterRole: Role,
  requesterTenantId: string | undefined
) {
  const cp = await db.query.chargePoints.findFirst({
    where: eq(chargePoints.id, id),
  });

  if (!cp) {
    throw new AppError(404, "Charge point not found");
  }

  if (requesterRole === "admin" && cp.tenantId !== requesterTenantId) {
    throw new AppError(403, "Insufficient permissions");
  }

  const updateData: Record<string, unknown> = { updatedAt: new Date() };
  if (input.name !== undefined) updateData.name = input.name;
  if (input.isActive !== undefined) updateData.isActive = input.isActive;

  const [updated] = await db
    .update(chargePoints)
    .set(updateData)
    .where(eq(chargePoints.id, id))
    .returning();

  if (!updated) throw new AppError(404, "Charge point not found");
  return updated;
}

export async function deleteChargePoint(
  id: string,
  requesterRole: Role,
  requesterTenantId: string | undefined
) {
  const cp = await db.query.chargePoints.findFirst({
    where: eq(chargePoints.id, id),
  });

  if (!cp) {
    throw new AppError(404, "Charge point not found");
  }

  if (requesterRole === "admin" && cp.tenantId !== requesterTenantId) {
    throw new AppError(403, "Insufficient permissions");
  }

  const [deleted] = await db
    .delete(chargePoints)
    .where(eq(chargePoints.id, id))
    .returning({ id: chargePoints.id, chargePointId: chargePoints.chargePointId });

  return deleted;
}
