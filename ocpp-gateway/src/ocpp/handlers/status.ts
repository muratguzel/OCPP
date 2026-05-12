/**
 * StatusNotification handler - OCPP 1.6 (connectorId, errorCode, status) and 2.x (evseId, connectorId, connectorStatus, timestamp)
 * Fallback: Connector Available olduğunda aktif transaction varsa webhook tetiklenir (StopTransaction.req / TransactionEvent Ended gelmeyen cihazlar için).
 *
 * Fallback meterStop, transaction'ın stored meterValues geçmişinden son
 * Energy.Active.Import.Register değeri okunarak türetiliyor — yoksa backend
 * kWh hesabı 0 çıkar (meterStop ?? meterStart fallback'i nedeniyle).
 */
import {
  updateConnectorStatus,
  getActiveTransactionForConnector,
  closeTransaction,
  type TransactionRecord,
} from '../../store/chargePoints.js';
import { notifyTransactionStopped } from '../../backend/client.js';
import { flattenStoredValues, extractEnergyRegisterWh } from '../meter.js';

type StatusParams = {
  connectorId: number;
  errorCode?: string;
  status?: string;
  evseId?: number;
  connectorStatus?: string;
  timestamp?: string;
};

/** Walk stored meterValues newest-first; return first usable Energy register in Wh. */
function deriveMeterStopFromHistory(tx: TransactionRecord): number | undefined {
  for (let i = tx.meterValues.length - 1; i >= 0; i--) {
    const samples = flattenStoredValues(tx.meterValues[i].values);
    const wh = extractEnergyRegisterWh(samples);
    if (wh != null) return Math.round(wh);
  }
  return undefined;
}

export async function statusNotification(params: StatusParams, chargePointId: string): Promise<object> {
  const connectorId = params.connectorId ?? 0;
  const status = params.status ?? params.connectorStatus ?? 'Unknown';
  updateConnectorStatus(chargePointId, connectorId, status, {
    errorCode: params.errorCode,
    timestamp: params.timestamp,
    evseId: params.evseId,
  });

  // Fallback: Connector Available olduğunda, StopTransaction / TransactionEvent Ended gelmediyse transaction'ı kapat
  if (status === 'Available') {
    const activeTx = getActiveTransactionForConnector(chargePointId, connectorId);
    if (activeTx) {
      const endTime = params.timestamp ?? new Date().toISOString();
      const meterStop = deriveMeterStopFromHistory(activeTx);
      const closed = closeTransaction(chargePointId, activeTx.transactionId, meterStop, endTime);
      if (closed) {
        console.warn(
          `[status] fallback closing transaction (no StopTransaction received) chargePointId=${chargePointId} transactionId=${activeTx.transactionId} meterStop=${meterStop ?? 'unknown'}`
        );
        try {
          await notifyTransactionStopped({
            chargePointId,
            transactionId: activeTx.transactionId,
            meterStop,
            endTime,
          });
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          console.error(
            `[status] fallback stop webhook FAILED chargePointId=${chargePointId} transactionId=${activeTx.transactionId} err=${msg}`
          );
        }
      }
    }
  }

  return {};
}
