/**
 * Notifies backend when transactions start/stop.
 * Fire-and-forget; does not block OCPP handlers.
 */
const BACKEND_API_URL = process.env.BACKEND_API_URL ?? 'http://localhost:4000';

async function notifyBackend(
  path: string,
  body: Record<string, unknown>
): Promise<void> {
  const url = `${BACKEND_API_URL}/api/charge${path}`;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      console.warn(`[backend] ${path} returned ${res.status}`);
    }
  } catch (err) {
    console.warn(`[backend] ${path} failed:`, err instanceof Error ? err.message : err);
  }
}

export function notifyTransactionStarted(payload: {
  chargePointId: string;
  transactionId: number | string;
  connectorId: number;
  idTag: string;
  meterStart?: number;
  startTime?: string;
}): void {
  notifyBackend('/webhook/transaction-started', payload).catch((err) =>
    console.warn('[backend] transaction-started failed:', err instanceof Error ? err.message : err)
  );
}

export function notifyTransactionStopped(payload: {
  chargePointId: string;
  transactionId: number | string;
  meterStop?: number;
  endTime?: string;
}): void {
  const body = {
    chargePointId: String(payload.chargePointId ?? ''),
    transactionId: payload.transactionId,
    meterStop: payload.meterStop,
    endTime: payload.endTime,
  };
  notifyBackend('/webhook/transaction-stopped', body).catch((err) =>
    console.warn('[backend] transaction-stopped failed:', err instanceof Error ? err.message : err)
  );
}
