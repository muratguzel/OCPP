import { eq, and, gte, lte, sql, asc } from "drizzle-orm";
import { db } from "../../config/database.js";
import { transactions, users } from "../../config/schema.js";
import { AppError } from "../../middleware/errorHandler.js";
import type { PaymentsSummaryInput } from "./payments.schema.js";

type Role = "super_admin" | "admin" | "user";

/**
 * Payments search: filters transactions by startTime (UTC date range),
 * tenantId (from token for admin, from query for super_admin), optional userId, optional numaraTaj (via users join).
 * Called from GET /api/payments/summary (query: startDate, endDate, tenantId?, userId?, numaraTaj?).
 */
export async function getPaymentsSummary(
  requesterRole: Role,
  requesterTenantId: string | undefined,
  input: PaymentsSummaryInput
) {
  const effectiveTenantId =
    requesterRole === "super_admin" ? input.tenantId : requesterTenantId;

  if (requesterRole === "admin" && !effectiveTenantId) {
    throw new AppError(403, "Tenant context required");
  }

  const startDate = new Date(String(input.startDate).trim() + "T00:00:00.000Z");
  const endDate = new Date(String(input.endDate).trim() + "T23:59:59.999Z");
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    throw new AppError(400, "Invalid date format (use YYYY-MM-DD)");
  }

  const conditions = [
    gte(transactions.startTime, startDate),
    lte(transactions.startTime, endDate),
  ];

  if (effectiveTenantId) {
    conditions.push(eq(transactions.tenantId, effectiveTenantId));
  }
  if (input.userId) {
    conditions.push(eq(transactions.userId, input.userId));
  }

  const whereClause = and(...conditions);

  const withJoin = input.numaraTaj
    ? and(whereClause, eq(users.numaraTaj, input.numaraTaj))
    : whereClause;

  const [summary] = await db
    .select({
      totalCost: sql<string>`coalesce(sum(${transactions.cost})::text, '0')`,
      totalKwh: sql<string>`coalesce(sum(${transactions.kwh})::text, '0')`,
      sessionCount: sql<number>`count(*)::int`,
    })
    .from(transactions)
    .leftJoin(users, eq(transactions.userId, users.id))
    .where(withJoin);

  const breakdownResult = await db
    .select({
      userId: transactions.userId,
      numaraTaj: users.numaraTaj,
      name: users.name,
      totalCost: sql<string>`coalesce(sum(${transactions.cost})::text, '0')`,
      totalKwh: sql<string>`coalesce(sum(${transactions.kwh})::text, '0')`,
      sessionCount: sql<number>`count(*)::int`,
    })
    .from(transactions)
    .leftJoin(users, eq(transactions.userId, users.id))
    .where(withJoin)
    .groupBy(transactions.userId, users.numaraTaj, users.name);

  const breakdown = breakdownResult.map((r) => ({
    userId: r.userId ?? undefined,
    numaraTaj: r.numaraTaj ?? undefined,
    name: r.name ?? undefined,
    totalCost: parseFloat(r.totalCost),
    totalKwh: parseFloat(r.totalKwh),
    sessionCount: r.sessionCount,
  }));

  return {
    totalCost: parseFloat(summary?.totalCost ?? "0"),
    totalKwh: parseFloat(summary?.totalKwh ?? "0"),
    sessionCount: summary?.sessionCount ?? 0,
    breakdown,
  };
}

/**
 * Tek bir transaction için fiş verisi. Mobile "Fişi İndir" akışı bunu çağırır.
 * Owner kontrolü: user role ise sadece kendi transaction'ı; admin/super_admin
 * ise tenant kapsamında her transaction.
 */
export async function getReceiptDataForTransaction(
  requesterRole: Role,
  requesterUserId: string,
  requesterTenantId: string | undefined,
  ocppTransactionId: string
) {
  const conditions = [eq(transactions.ocppTransactionId, ocppTransactionId)];
  if (requesterRole === "user") {
    conditions.push(eq(transactions.userId, requesterUserId));
  } else if (requesterRole === "admin") {
    if (!requesterTenantId) throw new AppError(403, "Tenant context required");
    conditions.push(eq(transactions.tenantId, requesterTenantId));
  }

  const [row] = await db
    .select({
      id: transactions.id,
      startTime: transactions.startTime,
      endTime: transactions.endTime,
      chargePointId: transactions.chargePointId,
      kwh: transactions.kwh,
      cost: transactions.cost,
      userName: users.name,
      numaraTaj: users.numaraTaj,
    })
    .from(transactions)
    .leftJoin(users, eq(transactions.userId, users.id))
    .where(and(...conditions))
    .limit(1);

  if (!row) throw new AppError(404, "Transaction not found");

  const kwh = row.kwh ? parseFloat(row.kwh) : 0;
  const cost = row.cost ? parseFloat(row.cost) : 0;
  const fmt = (d: Date) => d.toISOString().slice(0, 10);

  return {
    startDate: fmt(row.startTime),
    endDate: fmt(row.endTime ?? row.startTime),
    totalCost: cost,
    totalKwh: kwh,
    sessionCount: 1,
    rows: [
      {
        startTime: row.startTime,
        endTime: row.endTime,
        chargePointId: row.chargePointId,
        kwh,
        cost,
        userName: row.userName ?? "-",
        numaraTaj: row.numaraTaj ?? "-",
      },
    ],
  };
}

export async function getPaymentsExportData(
  requesterRole: Role,
  requesterTenantId: string | undefined,
  input: PaymentsSummaryInput
) {
  const summary = await getPaymentsSummary(
    requesterRole,
    requesterTenantId,
    input
  );

  const effectiveTenantId =
    requesterRole === "super_admin" ? input.tenantId : requesterTenantId;

  const startDate = new Date(input.startDate + "T00:00:00.000Z");
  const endDate = new Date(input.endDate + "T23:59:59.999Z");

  const conditions = [
    gte(transactions.startTime, startDate),
    lte(transactions.startTime, endDate),
  ];
  if (effectiveTenantId) {
    conditions.push(eq(transactions.tenantId, effectiveTenantId));
  }
  if (input.userId) {
    conditions.push(eq(transactions.userId, input.userId));
  }
  const whereClause = and(...conditions);
  const withJoin = input.numaraTaj
    ? and(whereClause, eq(users.numaraTaj, input.numaraTaj))
    : whereClause;

  const rawRows = await db
    .select({
      id: transactions.id,
      startTime: transactions.startTime,
      endTime: transactions.endTime,
      chargePointId: transactions.chargePointId,
      kwh: transactions.kwh,
      cost: transactions.cost,
      userName: users.name,
      numaraTaj: users.numaraTaj,
    })
    .from(transactions)
    .leftJoin(users, eq(transactions.userId, users.id))
    .where(withJoin)
    .orderBy(asc(transactions.startTime));

  const rows = rawRows.map((r) => ({
      startTime: r.startTime,
      endTime: r.endTime,
      chargePointId: r.chargePointId,
      kwh: r.kwh ? parseFloat(r.kwh) : 0,
      cost: r.cost ? parseFloat(r.cost) : 0,
      userName: r.userName ?? "-",
      numaraTaj: r.numaraTaj ?? "-",
    }));

  return {
    startDate: input.startDate,
    endDate: input.endDate,
    totalCost: summary.totalCost,
    totalKwh: summary.totalKwh,
    sessionCount: summary.sessionCount,
    breakdown: summary.breakdown,
    rows,
  };
}
