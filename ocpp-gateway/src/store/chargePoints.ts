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
  online: boolean;
  disconnectedAt?: string;
  connectors: Map<number, ConnectorStatus>;
  transactions: Map<number | string, TransactionRecord>;
}

const chargePoints = new Map<string, ChargePointState>();
let nextTransactionId = 1;

/**
 * Idempotent: reconnect aynı chargePointId ile geldiğinde mevcut state
 * (transactions, connectors) korunur. Açık transaction varken WebSocket kopup
 * tekrar bağlandığında, cihaz offline kuyruğundan StopTransaction'ı yolladığı
 * anda transactionId hâlâ memory'de olur ve doğru kapanır.
 */
export function registerChargePoint(chargePointId: string, protocol: string): ChargePointState {
  const existing = chargePoints.get(chargePointId);
  if (existing) {
    existing.protocol = protocol;
    existing.connectedAt = new Date().toISOString();
    existing.online = true;
    existing.disconnectedAt = undefined;
    return existing;
  }
  const state: ChargePointState = {
    chargePointId,
    protocol,
    connectedAt: new Date().toISOString(),
    online: true,
    connectors: new Map(),
    transactions: new Map(),
  };
  chargePoints.set(chargePointId, state);
  return state;
}

/**
 * Sadece WebSocket bağlantısı için "offline" işaretler. ChargePointState
 * (özellikle açık transaction'lar) silinmez — OCPP semantiğinde cihaz
 * disconnect olsa bile şarja devam edebilir ve queue'daki mesajları reconnect
 * sonrası gönderir.
 */
export function markChargePointOffline(chargePointId: string): void {
  const cp = chargePoints.get(chargePointId);
  if (!cp) return;
  cp.online = false;
  cp.disconnectedAt = new Date().toISOString();
}

/** Hard remove. Sadece test/admin teardown senaryolarında kullanılmalı. */
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

/** Online (canlı WebSocket) olanları döner. UI ve /health bunu kullanmalı. */
export function getOnlineChargePoints(): ChargePointState[] {
  return Array.from(chargePoints.values()).filter((cp) => cp.online);
}

export function getConnectedCount(): number {
  return getOnlineChargePoints().length;
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

/**
 * Number/string transactionId fark etmeksizin kaydı bulur. Hydrate edilen
 * (DB'den seed) kayıtlar string key ile, gateway-içinde üretilen (OCPP 1.6
 * StartTransaction) kayıtlar number key ile saklanabilir; bu fonksiyon her
 * iki gösterimi de dener.
 */
function lookupTransaction(
  cp: ChargePointState,
  transactionId: number | string
): TransactionRecord | undefined {
  const exact = cp.transactions.get(transactionId);
  if (exact) return exact;
  if (typeof transactionId === 'number') {
    return cp.transactions.get(String(transactionId));
  }
  const asNum = Number(transactionId);
  return Number.isFinite(asNum) ? cp.transactions.get(asNum) : undefined;
}

export function updateTransactionMeter(
  chargePointId: string,
  transactionId: number | string,
  timestamp: string,
  values: unknown
): void {
  const cp = chargePoints.get(chargePointId);
  if (!cp) return;
  const tx = lookupTransaction(cp, transactionId);
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
  if (!cp) return undefined;
  const tx = lookupTransaction(cp, transactionId);
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
  const cp = chargePoints.get(chargePointId);
  if (!cp) return undefined;
  return lookupTransaction(cp, transactionId);
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
