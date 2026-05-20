/**
 * Notifies backend when transactions start/stop.
 * Returns a Promise so handlers can await and surface failures.
 *
 * Retry policy: up to MAX_ATTEMPTS with exponential backoff. Retryable on
 * network errors, timeouts, HTTP 5xx/408/429. 4xx is treated as a permanent
 * client error and throws immediately (no point retrying a malformed body).
 * Backend webhooks are idempotent (charge.service checks existing.endTime
 * and ocppTransactionId is unique) so retries are safe.
 */
const BACKEND_API_URL = process.env.BACKEND_API_URL ?? 'http://localhost:4000';
const MAX_ATTEMPTS = 3;
const ATTEMPT_TIMEOUT_MS = 3000;
const BACKOFF_BEFORE_ATTEMPT_MS = [0, 500, 2000]; // index = attempt - 1

export class BackendWebhookError extends Error {
  constructor(public path: string, message: string) {
    super(message);
    this.name = 'BackendWebhookError';
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

type AttemptResult =
  | { ok: true }
  | { ok: false; retryable: boolean; err: BackendWebhookError };

async function attemptOnce(
  path: string,
  body: Record<string, unknown>
): Promise<AttemptResult> {
  const url = `${BACKEND_API_URL}/api/charge${path}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), ATTEMPT_TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    if (res.ok) return { ok: true };
    const text = await res.text().catch(() => '');
    const retryable = res.status >= 500 || res.status === 408 || res.status === 429;
    return {
      ok: false,
      retryable,
      err: new BackendWebhookError(path, `HTTP ${res.status} ${text.slice(0, 200)}`),
    };
  } catch (e) {
    const reason = controller.signal.aborted
      ? `timeout after ${ATTEMPT_TIMEOUT_MS}ms`
      : e instanceof Error ? e.message : String(e);
    return {
      ok: false,
      retryable: true,
      err: new BackendWebhookError(path, reason),
    };
  } finally {
    clearTimeout(timeout);
  }
}

async function notifyBackend(
  path: string,
  body: Record<string, unknown>
): Promise<void> {
  let lastErr: BackendWebhookError | null = null;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const delay = BACKOFF_BEFORE_ATTEMPT_MS[attempt - 1] ?? 0;
    if (delay > 0) {
      console.warn(
        `[backend] ${path} retrying in ${delay}ms (attempt ${attempt}/${MAX_ATTEMPTS}, prev: ${lastErr?.message ?? 'unknown'})`
      );
      await sleep(delay);
    }

    const result = await attemptOnce(path, body);
    if (result.ok) {
      if (attempt > 1) {
        console.warn(`[backend] ${path} succeeded on attempt ${attempt}`);
      }
      return;
    }
    lastErr = result.err;
    if (!result.retryable) break;
  }

  throw lastErr ?? new BackendWebhookError(path, 'all attempts failed');
}

export async function notifyTransactionStarted(payload: {
  chargePointId: string;
  transactionId: number | string;
  connectorId: number;
  idTag: string;
  meterStart?: number;
  startTime?: string;
}): Promise<void> {
  await notifyBackend('/webhook/transaction-started', payload);
}

export async function notifyTransactionStopped(payload: {
  chargePointId: string;
  transactionId: number | string;
  meterStop?: number;
  endTime?: string;
}): Promise<void> {
  await notifyBackend('/webhook/transaction-stopped', {
    chargePointId: String(payload.chargePointId ?? ''),
    transactionId: payload.transactionId,
    meterStop: payload.meterStop,
    endTime: payload.endTime,
  });
}

export interface BackendActiveTransaction {
  ocppTransactionId: string;
  connectorId: number;
  idTag: string;
  meterStart: number | null;
  startTime: string;
}

/**
 * Gateway boot/reconnect sonrası açık transaction'ları DB'den çeker. Memory
 * boşken seed etmek içindir — başarısız olursa fatal değil, sadece UX kaybı.
 */
export async function fetchActiveTransactions(
  chargePointId: string
): Promise<BackendActiveTransaction[]> {
  const url = `${BACKEND_API_URL}/api/charge/internal/active-transactions/${encodeURIComponent(chargePointId)}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), ATTEMPT_TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) {
      console.warn(
        `[backend] fetchActiveTransactions ${chargePointId} HTTP ${res.status}`
      );
      return [];
    }
    const data = (await res.json()) as { transactions?: BackendActiveTransaction[] };
    return data.transactions ?? [];
  } catch (e) {
    const reason = controller.signal.aborted
      ? `timeout after ${ATTEMPT_TIMEOUT_MS}ms`
      : e instanceof Error ? e.message : String(e);
    console.warn(`[backend] fetchActiveTransactions ${chargePointId} failed: ${reason}`);
    return [];
  } finally {
    clearTimeout(timeout);
  }
}
