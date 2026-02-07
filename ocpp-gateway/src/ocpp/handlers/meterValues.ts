/**
 * MeterValues handler - OCPP 1.6 and 2.x
 */
import { updateTransactionMeter } from '../../store/chargePoints.js';

type MeterValuesParams = {
  connectorId?: number;
  transactionId?: number;
  meterValue: Array<{
    timestamp: string;
    sampledValue: unknown[];
  }>;
};

export function meterValues(params: MeterValuesParams, chargePointId: string): object {
  const transactionId = params.transactionId;
  if (transactionId == null) return {};

  const timestamp = params.meterValue?.[0]?.timestamp ?? new Date().toISOString();
  const values = params.meterValue ?? [];
  updateTransactionMeter(chargePointId, transactionId, timestamp, values);
  return {};
}
