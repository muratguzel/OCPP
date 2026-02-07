import { eq, and } from "drizzle-orm";
import { db } from "../../config/database.js";
import { transactions } from "../../config/schema.js";
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
  input: StartChargeInput
): Promise<{ success: boolean; status: string; chargePointId: string }> {
  const cp = await getChargePointByChargePointId(input.chargePointId);
  if (!cp) {
    throw new AppError(404, "Charge point not found in system");
  }
  if (!cp.isActive) {
    throw new AppError(400, "Charge point is not active");
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
  const ocppTxId = String(input.transactionId);

  const [existing] = await db
    .select()
    .from(transactions)
    .where(
      and(
        eq(transactions.chargePointId, input.chargePointId),
        eq(transactions.ocppTransactionId, ocppTxId)
      )
    )
    .limit(1);

  if (!existing) {
    console.warn(
      `[charge/webhook] Transaction not found: ${input.chargePointId}/${ocppTxId}, skipping stop`
    );
    return;
  }

  const meterStart = existing.meterStart ?? 0;
  const meterStop = input.meterStop ?? meterStart;
  const wh = Math.max(0, meterStop - meterStart);
  const kwh = wh / 1000;
  const PRICE_PER_KWH = 12.5;
  const cost = kwh * PRICE_PER_KWH;

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
