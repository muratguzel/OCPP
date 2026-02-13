/**
 * StatusNotification handler - OCPP 1.6 (connectorId, errorCode, status) and 2.x (evseId, connectorId, connectorStatus, timestamp)
 * Fallback: Connector Available olduğunda aktif transaction varsa webhook tetiklenir (TransactionEvent Ended gelmeyen cihazlar için).
 */
import {
  updateConnectorStatus,
  getActiveTransactionForConnector,
  closeTransaction,
} from '../../store/chargePoints.js';
import { notifyTransactionStopped } from '../../backend/client.js';

type StatusParams = {
  connectorId: number;
  errorCode?: string;
  status?: string;
  evseId?: number;
  connectorStatus?: string;
  timestamp?: string;
};

export function statusNotification(params: StatusParams, chargePointId: string): object {
  const connectorId = params.connectorId ?? 0;
  const status = params.status ?? params.connectorStatus ?? 'Unknown';
  updateConnectorStatus(chargePointId, connectorId, status, {
    errorCode: params.errorCode,
    timestamp: params.timestamp,
    evseId: params.evseId,
  });

  // Fallback: Connector Available olduğunda, TransactionEvent Ended gelmediyse transaction'ı kapat
  if (status === 'Available') {
    const activeTx = getActiveTransactionForConnector(chargePointId, connectorId);
    if (activeTx) {
      const endTime = params.timestamp ?? new Date().toISOString();
      const closed = closeTransaction(chargePointId, activeTx.transactionId, undefined, endTime);
      if (closed) {
        notifyTransactionStopped({
          chargePointId,
          transactionId: activeTx.transactionId,
          endTime,
        });
      }
    }
  }

  return {};
}
