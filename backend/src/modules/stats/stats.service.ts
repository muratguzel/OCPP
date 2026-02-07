import { sql, eq, and, gte } from "drizzle-orm";
import { db } from "../../config/database.js";
import {
  chargePoints,
  tenants,
  transactions,
} from "../../config/schema.js";
import { AppError } from "../../middleware/errorHandler.js";

type Role = "super_admin" | "admin" | "user";

export async function getOverview(
  requesterRole: Role,
  requesterTenantId: string | undefined,
  filterTenantId?: string
) {
  if (requesterRole === "super_admin") {
    const filterTenant = filterTenantId ?? undefined;

    const [tenantCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(tenants);

    const cpWhere = filterTenant ? eq(chargePoints.tenantId, filterTenant) : undefined;
    const [cpCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(chargePoints)
      .where(cpWhere);

    const txWhere = filterTenant ? eq(transactions.tenantId, filterTenant) : undefined;
    const [energyResult] = await db
      .select({
        total: sql<string>`coalesce(sum(${transactions.kwh})::text, '0')`,
      })
      .from(transactions)
      .where(txWhere);

    const [revenueResult] = await db
      .select({
        total: sql<string>`coalesce(sum(${transactions.cost})::text, '0')`,
      })
      .from(transactions)
      .where(txWhere);

    return {
      tenantCount: filterTenant ? undefined : tenantCount?.count ?? 0,
      chargePointCount: cpCount?.count ?? 0,
      totalEnergyKwh: parseFloat(energyResult?.total ?? "0"),
      totalRevenue: parseFloat(revenueResult?.total ?? "0"),
    };
  }

  if (requesterRole === "admin" && requesterTenantId) {
    const [cpCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(chargePoints)
      .where(eq(chargePoints.tenantId, requesterTenantId));

    const [energyResult] = await db
      .select({
        total: sql<string>`coalesce(sum(${transactions.kwh})::text, '0')`,
      })
      .from(transactions)
      .where(eq(transactions.tenantId, requesterTenantId));

    const [revenueResult] = await db
      .select({
        total: sql<string>`coalesce(sum(${transactions.cost})::text, '0')`,
      })
      .from(transactions)
      .where(eq(transactions.tenantId, requesterTenantId));

    return {
      tenantCount: undefined,
      chargePointCount: cpCount?.count ?? 0,
      totalEnergyKwh: parseFloat(energyResult?.total ?? "0"),
      totalRevenue: parseFloat(revenueResult?.total ?? "0"),
    };
  }

  throw new AppError(403, "Insufficient permissions");
}

export async function getUsage(
  requesterRole: Role,
  requesterTenantId: string | undefined,
  tenantId: string | undefined,
  period: "day" | "week"
) {
  const effectiveTenantId =
    requesterRole === "super_admin" ? tenantId : requesterTenantId;

  if (!effectiveTenantId && requesterRole === "admin") {
    throw new AppError(403, "Tenant context required");
  }

  const days = period === "day" ? 1 : 7;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  startDate.setHours(0, 0, 0, 0);

  const whereConditions = effectiveTenantId
    ? and(
        eq(transactions.tenantId, effectiveTenantId),
        gte(transactions.startTime, startDate)
      )
    : gte(transactions.startTime, startDate);

  const result = await db
    .select({
      date: sql<string>`date(${transactions.startTime})`.as("date"),
      kwh: sql<string>`coalesce(sum(${transactions.kwh})::text, '0')`.as("kwh"),
      count: sql<number>`count(*)::int`.as("count"),
    })
    .from(transactions)
    .where(whereConditions)
    .groupBy(sql`date(${transactions.startTime})`);

  return result.map((r) => ({
    date: r.date,
    kwh: parseFloat(r.kwh),
    sessionCount: r.count,
  }));
}
