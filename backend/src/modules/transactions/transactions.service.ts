import { eq, and, desc } from "drizzle-orm";
import { db } from "../../config/database.js";
import { transactions, chargePoints } from "../../config/schema.js";
import { AppError } from "../../middleware/errorHandler.js";

type Role = "super_admin" | "admin" | "user";

export async function listTransactions(
  requesterRole: Role,
  requesterTenantId: string | undefined,
  requesterUserId: string | undefined,
  tenantIdFilter?: string,
  userIdFilter?: string
) {
  const withUser = {
    user: {
      columns: { id: true, email: true, name: true },
    },
  };

  if (requesterRole === "user") {
    if (!requesterUserId) {
      throw new AppError(403, "User context required");
    }
    return db.query.transactions.findMany({
      where: eq(transactions.userId, requesterUserId),
      orderBy: [desc(transactions.startTime)],
      with: withUser,
    });
  }

  if (requesterRole === "admin" && requesterTenantId) {
    return db.query.transactions.findMany({
      where: eq(transactions.tenantId, requesterTenantId),
      orderBy: [desc(transactions.startTime)],
      with: withUser,
    });
  }

  if (requesterRole === "super_admin") {
    const conditions = [];
    if (tenantIdFilter) {
      conditions.push(eq(transactions.tenantId, tenantIdFilter));
    }
    if (userIdFilter) {
      conditions.push(eq(transactions.userId, userIdFilter));
    }
    return db.query.transactions.findMany({
      where: conditions.length > 0 ? and(...conditions) : undefined,
      orderBy: [desc(transactions.startTime)],
      with: withUser,
    });
  }

  throw new AppError(403, "Insufficient permissions");
}
