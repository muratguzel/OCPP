/**
 * StatusNotification handler - OCPP 1.6 (connectorId, errorCode, status) and 2.x (evseId, connectorId, connectorStatus, timestamp)
 */
import { updateConnectorStatus } from '../../store/chargePoints.js';

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
  return {};
}
