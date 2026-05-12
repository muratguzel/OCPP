/**
 * StartTransaction, StopTransaction (OCPP 1.6) and TransactionEvent (OCPP 2.x)
 * Notifies backend webhook for transaction persistence (userId tracking).
 *
 * Webhook calls are awaited so we can surface failures. On webhook failure
 * we still return Accepted to the device — OCPP spec doesn't let us reject
 * a Stop, and the device has already physically acted. Failures are logged
 * loudly with chargePointId+transactionId so ops can reconcile (retry in
 * step 2 of the fix plan).
 */
import {
  saveTransaction,
  closeTransaction,
  generateTransactionId,
  updateTransactionMeter,
} from '../../store/chargePoints.js';
import { notifyTransactionStarted, notifyTransactionStopped } from '../../backend/client.js';
import { flattenMeterValues, extractEnergyRegisterWh } from '../meter.js';

function logWebhookFailure(
  kind: 'start' | 'stop',
  chargePointId: string,
  transactionId: number | string,
  err: unknown
): void {
  const msg = err instanceof Error ? err.message : String(err);
  console.error(
    `[transaction] ${kind} webhook FAILED chargePointId=${chargePointId} transactionId=${transactionId} err=${msg}`
  );
}

// --- OCPP 1.6 ---
type StartTransactionParams = {
  connectorId: number;
  idTag: string;
  meterStart?: number;
  timestamp?: string;
};

export async function startTransaction(params: StartTransactionParams, chargePointId: string): Promise<{
  idTagInfo: { status: string };
  transactionId: number;
}> {
  const transactionId = generateTransactionId();
  const startTime = params.timestamp ?? new Date().toISOString();
  saveTransaction(chargePointId, {
    transactionId,
    chargePointId,
    connectorId: params.connectorId,
    idTag: params.idTag,
    meterStart: params.meterStart,
    startTime,
  });
  try {
    await notifyTransactionStarted({
      chargePointId,
      transactionId,
      connectorId: params.connectorId,
      idTag: params.idTag,
      meterStart: params.meterStart,
      startTime,
    });
  } catch (err) {
    logWebhookFailure('start', chargePointId, transactionId, err);
  }
  return {
    idTagInfo: { status: 'Accepted' },
    transactionId,
  };
}

type StopTransactionParams = {
  transactionId: number;
  idTag?: string;
  meterStop?: number;
  timestamp?: string;
};

export async function stopTransaction(params: StopTransactionParams, chargePointId: string): Promise<{
  idTagInfo: { status: string };
}> {
  closeTransaction(
    chargePointId,
    params.transactionId,
    params.meterStop,
    params.timestamp
  );
  try {
    await notifyTransactionStopped({
      chargePointId,
      transactionId: params.transactionId,
      meterStop: params.meterStop,
      endTime: params.timestamp,
    });
  } catch (err) {
    logWebhookFailure('stop', chargePointId, params.transactionId, err);
  }
  return { idTagInfo: { status: 'Accepted' } };
}

// --- OCPP 2.x TransactionEvent ---
// Payload varies by charger; accept both spec and common variants (2.0.1, 2.1).
type TransactionEventParams = {
  eventType?: string;
  evse?: { id?: number };
  connectorId?: number;
  transactionId?: string | number;
  idToken?: string | { idToken?: string };
  transactionInfo?: {
    transactionId?: string | number;
    idToken?: string | { idToken?: string };
  };
  meterValue?: Array<{ timestamp?: string; sampledValue?: unknown[] }>;
  meterValues?: Array<{ timestamp?: string; sampledValue?: unknown[] }>;
};

function normalizeEventType(eventType: string | undefined): 'Started' | 'Updated' | 'Ended' | null {
  const t = (eventType ?? '').trim().toLowerCase();
  if (t === 'started') return 'Started';
  if (t === 'updated') return 'Updated';
  if (t === 'ended') return 'Ended';
  return null;
}

function normalizeTransactionId(params: TransactionEventParams): string {
  const fromInfo = params.transactionInfo?.transactionId;
  const raw = fromInfo ?? params.transactionId;
  if (raw === undefined || raw === null) return '';
  return String(raw);
}

function normalizeIdTag(params: TransactionEventParams): string {
  // OCPP 2.x: idToken can be at root level or nested in transactionInfo
  const idToken = params.idToken ?? params.transactionInfo?.idToken;
  if (idToken == null) return '';
  if (typeof idToken === 'string') return idToken;
  return (idToken as { idToken?: string }).idToken ?? '';
}

export async function transactionEvent(params: TransactionEventParams, chargePointId: string): Promise<{
  idTokenInfo?: { status: string };
}> {
  const eventType = normalizeEventType(params.eventType);
  const evseId = params.evse?.id ?? 0;
  const connectorId = params.connectorId ?? evseId;
  const transactionId = normalizeTransactionId(params);
  const idTag = normalizeIdTag(params);

  // Support both meterValue (spec) and meterValues (some implementations)
  const meterValueList = params.meterValue ?? params.meterValues ?? [];

  if (eventType === 'Started') {
    const startTime = new Date().toISOString();
    saveTransaction(chargePointId, {
      transactionId,
      chargePointId,
      connectorId,
      idTag,
      startTime,
    });
    try {
      await notifyTransactionStarted({
        chargePointId,
        transactionId,
        connectorId,
        idTag,
        startTime,
      });
    } catch (err) {
      logWebhookFailure('start', chargePointId, transactionId, err);
    }
    return { idTokenInfo: { status: 'Accepted' } };
  }

  if (eventType === 'Updated' && meterValueList.length) {
    for (const mv of meterValueList) {
      const timestamp = mv.timestamp ?? new Date().toISOString();
      updateTransactionMeter(chargePointId, transactionId, timestamp, mv.sampledValue ?? []);
    }
  }

  if (eventType === 'Ended') {
    const samples = flattenMeterValues(meterValueList);
    const meterStopWh = extractEnergyRegisterWh(samples);
    const value = meterStopWh != null ? Math.round(meterStopWh) : undefined;
    const endTime = meterValueList[0]?.timestamp ?? new Date().toISOString();
    closeTransaction(chargePointId, transactionId, value);
    try {
      await notifyTransactionStopped({
        chargePointId,
        transactionId,
        meterStop: value,
        endTime,
      });
    } catch (err) {
      logWebhookFailure('stop', chargePointId, transactionId, err);
    }
  }

  return {};
}
