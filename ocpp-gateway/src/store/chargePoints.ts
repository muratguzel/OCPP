/**
 * In-memory store for connected charge points and transactions.
 * Can be replaced later with Redis or Backend API push.
 */

export interface ConnectorStatus {
  connectorId: number;
  status: string;
  errorCode?: string;
  timestamp?: string;
  evseId?: number;
}

export interface TransactionRecord {
  transactionId: number | string;
  chargePointId: string;
  connectorId: number;
  idTag: string;
  meterStart?: number;
  meterStop?: number;
  startTime: string;
  endTime?: string;
  meterValues: Array<{ timestamp: string; values: unknown }>;
}

export interface ChargePointState {
  chargePointId: string;
  protocol: string;
  connectedAt: string;
  connectors: Map<number, ConnectorStatus>;
  transactions: Map<number | string, TransactionRecord>;
}

const chargePoints = new Map<string, ChargePointState>();
let nextTransactionId = 1;

export function registerChargePoint(chargePointId: string, protocol: string): ChargePointState {
  const state: ChargePointState = {
    chargePointId,
    protocol,
    connectedAt: new Date().toISOString(),
    connectors: new Map(),
    transactions: new Map(),
  };
  chargePoints.set(chargePointId, state);
  return state;
}

export function unregisterChargePoint(chargePointId: string): void {
  chargePoints.delete(chargePointId);
}

export function getChargePoint(chargePointId: string): ChargePointState | undefined {
  return chargePoints.get(chargePointId);
}

/** Case-insensitive lookup: istekte gelen chargePointId ile kayıtlı CP'yi bulur. */
export function getChargePointByIdentity(identity: string): ChargePointState | undefined {
  const exact = chargePoints.get(identity);
  if (exact) return exact;
  const lower = identity.toLowerCase();
  for (const [id, state] of chargePoints) {
    if (id.toLowerCase() === lower) return state;
  }
  return undefined;
}

export function getAllChargePoints(): ChargePointState[] {
  return Array.from(chargePoints.values());
}

export function getConnectedCount(): number {
  return chargePoints.size;
}

export function updateConnectorStatus(
  chargePointId: string,
  connectorId: number,
  status: string,
  options: { errorCode?: string; timestamp?: string; evseId?: number } = {}
): void {
  const cp = chargePoints.get(chargePointId);
  if (!cp) return;
  cp.connectors.set(connectorId, {
    connectorId,
    status,
    errorCode: options.errorCode,
    timestamp: options.timestamp,
    evseId: options.evseId,
  });
}

export function generateTransactionId(): number {
  return nextTransactionId++;
}

export function saveTransaction(
  chargePointId: string,
  record: Omit<TransactionRecord, 'meterValues'> & { meterValues?: TransactionRecord['meterValues'] }
): void {
  const cp = chargePoints.get(chargePointId);
  if (!cp) return;
  const full: TransactionRecord = {
    ...record,
    meterValues: record.meterValues ?? [],
  };
  cp.transactions.set(record.transactionId, full);
}

export function updateTransactionMeter(
  chargePointId: string,
  transactionId: number | string,
  timestamp: string,
  values: unknown
): void {
  const cp = chargePoints.get(chargePointId);
  const tx = cp?.transactions.get(transactionId);
  if (!tx) return;
  tx.meterValues.push({ timestamp, values });
}

/**
 * Marks a transaction as closed. Returns the record only on first close;
 * if already closed, returns undefined so callers can avoid double-notifying the backend.
 */
export function closeTransaction(
  chargePointId: string,
  transactionId: number | string,
  meterStop?: number,
  endTime?: string
): TransactionRecord | undefined {
  const cp = chargePoints.get(chargePointId);
  const tx = cp?.transactions.get(transactionId);
  if (!tx) return undefined;
  if (tx.endTime) return undefined; // already closed, idempotent
  tx.meterStop = meterStop;
  tx.endTime = endTime ?? new Date().toISOString();
  return tx;
}

export function getTransaction(
  chargePointId: string,
  transactionId: number | string
): TransactionRecord | undefined {
  return chargePoints.get(chargePointId)?.transactions.get(transactionId);
}

/** Aktif (henüz endTime olmayan) transaction'ı connector için bulur. StatusNotification Available fallback için. */
export function getActiveTransactionForConnector(
  chargePointId: string,
  connectorId: number
): TransactionRecord | undefined {
  const cp = chargePoints.get(chargePointId);
  if (!cp) return undefined;
  for (const tx of cp.transactions.values()) {
    if (tx.connectorId === connectorId && !tx.endTime) return tx;
  }
  return undefined;
}

/** Bir CP'ye ait tüm transaction'ları listeler (aktif ve bitmiş). */
export function getTransactionsForChargePoint(chargePointId: string): TransactionRecord[] {
  const cp = chargePoints.get(chargePointId);
  if (!cp) return [];
  return Array.from(cp.transactions.values());
}
