/**
 * StartTransaction, StopTransaction (OCPP 1.6) and TransactionEvent (OCPP 2.x)
 * Notifies backend webhook for transaction persistence (userId tracking).
 */
import {
  saveTransaction,
  closeTransaction,
  generateTransactionId,
  updateTransactionMeter,
} from '../../store/chargePoints.js';
import { notifyTransactionStarted, notifyTransactionStopped } from '../../backend/client.js';

// --- OCPP 1.6 ---
type StartTransactionParams = {
  connectorId: number;
  idTag: string;
  meterStart?: number;
  timestamp?: string;
};

export function startTransaction(params: StartTransactionParams, chargePointId: string): {
  idTagInfo: { status: string };
  transactionId: number;
} {
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
  notifyTransactionStarted({
    chargePointId,
    transactionId,
    connectorId: params.connectorId,
    idTag: params.idTag,
    meterStart: params.meterStart,
    startTime,
  });
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

export function stopTransaction(params: StopTransactionParams, chargePointId: string): {
  idTagInfo: { status: string };
} {
  closeTransaction(
    chargePointId,
    params.transactionId,
    params.meterStop,
    params.timestamp
  );
  // Always notify backend so transaction is closed even if we never had it in store (e.g. CP reconnected).
  notifyTransactionStopped({
    chargePointId,
    transactionId: params.transactionId,
    meterStop: params.meterStop,
    endTime: params.timestamp,
  });
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

export function transactionEvent(params: TransactionEventParams, chargePointId: string): {
  idTokenInfo?: { status: string };
} {
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
    notifyTransactionStarted({
      chargePointId,
      transactionId,
      connectorId,
      idTag,
      startTime,
    });
    return { idTokenInfo: { status: 'Accepted' } };
  }

  if (eventType === 'Updated' && meterValueList.length) {
    for (const mv of meterValueList) {
      const timestamp = mv.timestamp ?? new Date().toISOString();
      updateTransactionMeter(chargePointId, transactionId, timestamp, mv.sampledValue ?? []);
    }
  }

  if (eventType === 'Ended') {
    const sampled = meterValueList[0]?.sampledValue as Array<{ measurand?: string; value: string }> | undefined;
    const meterStopVal = sampled?.find((s) => s.measurand === 'Energy.Active.Import.Register');
    const value = meterStopVal ? Number(meterStopVal.value) : undefined;
    const endTime = meterValueList[0]?.timestamp ?? new Date().toISOString();
    closeTransaction(chargePointId, transactionId, value);
    // Always notify backend so transaction is closed even if we never had it in store (e.g. CP reconnected).
    notifyTransactionStopped({
      chargePointId,
      transactionId,
      meterStop: value,
      endTime,
    });
  }

  return {};
}
