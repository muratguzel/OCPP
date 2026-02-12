import { eq, and, sql, isNull } from "drizzle-orm";
import { db } from "../../config/database.js";
import { transactions, tenants } from "../../config/schema.js";
import { getChargePointByChargePointId } from "../charge-points/charge-points.service.js";
import { AppError } from "../../middleware/errorHandler.js";
import type {
  StartChargeInput,
  WebhookTransactionStartedInput,
  WebhookTransactionStoppedInput,
} from "./charge.schema.js";

const GATEWAY_URL =
  process.env.OCPP_GATEWAY_URL ?? "http://localhost:3000";

export async function startCharge(
  userId: string,
  userTenantId: string | undefined,
  userRole: "super_admin" | "admin" | "user",
  input: StartChargeInput
): Promise<{ success: boolean; status: string; chargePointId: string }> {
  const cp = await getChargePointByChargePointId(input.chargePointId);
  if (!cp) {
    throw new AppError(404, "Charge point not found in system");
  }
  if (!cp.isActive) {
    throw new AppError(400, "Charge point is not active");
  }

  if (userRole !== "super_admin" && userTenantId) {
    if (cp.tenantId !== userTenantId) {
      throw new AppError(403, "Charge point does not belong to your organization");
    }
  }

  const url = `${GATEWAY_URL}/remote-start`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chargePointId: input.chargePointId,
      idTag: userId,
      connectorId: input.connectorId,
    }),
  });

  const contentType = res.headers.get("content-type") ?? "";
  let data: { success?: boolean; status?: string; chargePointId?: string; error?: string };
  if (contentType.includes("application/json")) {
    data = (await res.json()) as typeof data;
  } else {
    const text = await res.text();
    const preview = text.slice(0, 80).replace(/\s+/g, " ");
    throw new AppError(
      502,
      `OCPP Gateway returned non-JSON (got ${contentType}). ` +
        `Check OCPP_GATEWAY_URL (${GATEWAY_URL}). Response preview: ${preview}`
    );
  }

  if (!res.ok) {
    throw new AppError(
      res.status >= 500 ? 502 : res.status,
      data.error ?? "Gateway request failed"
    );
  }

  return {
    success: data.success ?? false,
    status: data.status ?? "Unknown",
    chargePointId: data.chargePointId ?? input.chargePointId,
  };
}

export async function webhookTransactionStarted(
  input: WebhookTransactionStartedInput
): Promise<void> {
  const cp = await getChargePointByChargePointId(input.chargePointId);
  if (!cp) {
    console.warn(
      `[charge/webhook] Charge point not found: ${input.chargePointId}, skipping transaction create`
    );
    return;
  }

  const ocppTxId = String(input.transactionId);
  const userId = input.idTag.match(/^[0-9a-f-]{36}$/i) ? input.idTag : null;

  await db.insert(transactions).values({
    ocppTransactionId: ocppTxId,
    chargePointId: input.chargePointId,
    tenantId: cp.tenantId,
    userId: userId ?? null,
    connectorId: input.connectorId,
    idTag: input.idTag,
    meterStart: input.meterStart ?? null,
    startTime: input.startTime ? new Date(input.startTime) : new Date(),
  });
}

export async function webhookTransactionStopped(
  input: WebhookTransactionStoppedInput
): Promise<void> {
  const ocppTxId = String(input.transactionId ?? "").trim();
  const chargePointIdRaw = String(input.chargePointId ?? "").trim();
  if (!ocppTxId || !chargePointIdRaw) {
    console.warn(
      "[charge/webhook] transaction-stopped missing chargePointId or transactionId, skipping"
    );
    return;
  }

  let [existing] = await db
    .select()
    .from(transactions)
    .where(
      and(
        sql`lower(${transactions.chargePointId}) = lower(${chargePointIdRaw})`,
        eq(transactions.ocppTransactionId, ocppTxId)
      )
    )
    .limit(1);

  if (!existing) {
    const openByTxId = await db
      .select()
      .from(transactions)
      .where(
        and(eq(transactions.ocppTransactionId, ocppTxId), isNull(transactions.endTime))
      )
      .limit(2);
    if (openByTxId.length === 1) {
      existing = openByTxId[0];
    }
  }

  if (!existing) {
    console.warn(
      `[charge/webhook] Transaction not found: chargePointId=${chargePointIdRaw} ocppTxId=${ocppTxId}, skipping stop`
    );
    return;
  }

  // Idempotent: already ended (e.g. StatusNotification fallback closed first)
  if (existing.endTime) {
    return;
  }

  const meterStart = existing.meterStart ?? 0;
  const meterStop = input.meterStop ?? meterStart;
  const wh = Math.max(0, meterStop - meterStart);
  const kwh = wh / 1000;

  const tenant = await db.query.tenants.findFirst({
    where: eq(tenants.id, existing.tenantId),
    columns: { pricePerKwh: true, vatRate: true },
  });

  const pricePerKwh = tenant?.pricePerKwh
    ? parseFloat(tenant.pricePerKwh)
    : 0;
  const vatRate = tenant?.vatRate ? parseFloat(tenant.vatRate) : 0;
  const subtotal = kwh * pricePerKwh;
  const cost = subtotal * (1 + vatRate / 100);

  await db
    .update(transactions)
    .set({
      meterStop: input.meterStop ?? existing.meterStop,
      endTime: input.endTime ? new Date(input.endTime) : new Date(),
      kwh: kwh.toFixed(2),
      cost: cost.toFixed(2),
    })
    .where(eq(transactions.id, existing.id));
}

/** Get price per kWh and VAT rate for a charge point (from its tenant). Used by mobile for live cost display. */
export async function getPriceForChargePoint(chargePointId: string): Promise<{
  pricePerKwh: number;
  vatRate: number;
}> {
  const cp = await getChargePointByChargePointId(chargePointId);
  if (!cp) {
    throw new AppError(404, "Charge point not found");
  }
  const tenant = await db.query.tenants.findFirst({
    where: eq(tenants.id, cp.tenantId),
    columns: { pricePerKwh: true, vatRate: true },
  });
  const pricePerKwh = tenant?.pricePerKwh ? parseFloat(tenant.pricePerKwh) : 0;
  const vatRate = tenant?.vatRate ? parseFloat(tenant.vatRate) : 0;
  return { pricePerKwh, vatRate };
}
