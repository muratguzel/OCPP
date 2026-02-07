/**
 * StartTransaction, StopTransaction (OCPP 1.6) and TransactionEvent (OCPP 2.x)
 */
import {
  saveTransaction,
  closeTransaction,
  generateTransactionId,
  updateTransactionMeter,
} from '../../store/chargePoints.js';

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
  saveTransaction(chargePointId, {
    transactionId,
    chargePointId,
    connectorId: params.connectorId,
    idTag: params.idTag,
    meterStart: params.meterStart,
    startTime: params.timestamp ?? new Date().toISOString(),
  });
  return {
    idTagInfo: { status: 'Accepted' },
    transactionId,
  };
}

type StopTransactionParams = {
  transactionId: number;
  idTag?: string;
  meterStop: number;
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
  return { idTagInfo: { status: 'Accepted' } };
}

// --- OCPP 2.x TransactionEvent ---
type TransactionEventParams = {
  eventType: 'Started' | 'Updated' | 'Ended';
  evse?: { id: number };
  connectorId?: number;
  transactionInfo?: {
    transactionId: string;
    idToken?: { idToken: string };
  };
  meterValue?: Array<{ timestamp: string; sampledValue: unknown[] }>;
};

export function transactionEvent(params: TransactionEventParams, chargePointId: string): {
  idTokenInfo?: { status: string };
} {
  const evseId = params.evse?.id ?? 0;
  const connectorId = params.connectorId ?? evseId;
  const transactionId = params.transactionInfo?.transactionId ?? '';
  const idTag = params.transactionInfo?.idToken?.idToken ?? '';

  if (params.eventType === 'Started') {
    saveTransaction(chargePointId, {
      transactionId,
      chargePointId,
      connectorId,
      idTag,
      startTime: new Date().toISOString(),
    });
    return { idTokenInfo: { status: 'Accepted' } };
  }

  if (params.eventType === 'Updated' && params.meterValue?.length) {
    for (const mv of params.meterValue) {
      const timestamp = mv.timestamp ?? new Date().toISOString();
      updateTransactionMeter(chargePointId, transactionId, timestamp, mv.sampledValue ?? []);
    }
  }

  if (params.eventType === 'Ended') {
    const sampled = params.meterValue?.[0]?.sampledValue as Array<{ measurand?: string; value: string }> | undefined;
    const meterStop = sampled?.find((s) => s.measurand === 'Energy.Active.Import.Register');
    const value = meterStop ? Number(meterStop.value) : undefined;
    closeTransaction(chargePointId, transactionId, value);
  }

  return {};
}
