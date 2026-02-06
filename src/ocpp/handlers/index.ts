/**
 * Attach all OCPP handlers to a charge point connection.
 * ocpp-rpc passes { params, method, messageId, signal, reply } to each handler.
 */
import { bootNotification } from './boot.js';
import { heartbeat } from './heartbeat.js';
import { statusNotification } from './status.js';
import { authorize } from './authorize.js';
import {
  startTransaction,
  stopTransaction,
  transactionEvent,
} from './transaction.js';
import { meterValues } from './meterValues.js';

type ChargePoint = {
  identity: string;
  protocol?: string;
  handle: (action: string, fn: (payload: { params: unknown }) => Promise<unknown> | unknown) => void;
  on: (event: string, fn: () => void) => void;
  call?: (action: string, params: unknown) => Promise<unknown>;
};

export function attachHandlers(cp: ChargePoint): void {
  const id = cp.identity;

  cp.handle('BootNotification', async () => bootNotification());
  cp.handle('Heartbeat', async () => heartbeat());
  cp.handle('StatusNotification', async ({ params }: { params: unknown }) =>
    statusNotification(params as Parameters<typeof statusNotification>[0], id)
  );
  cp.handle('Authorize', async ({ params }: { params: unknown }) =>
    authorize(params as Parameters<typeof authorize>[0])
  );

  cp.handle('StartTransaction', async ({ params }: { params: unknown }) =>
    startTransaction(params as Parameters<typeof startTransaction>[0], id)
  );
  cp.handle('StopTransaction', async ({ params }: { params: unknown }) =>
    stopTransaction(params as Parameters<typeof stopTransaction>[0], id)
  );
  cp.handle('TransactionEvent', async ({ params }: { params: unknown }) =>
    transactionEvent(params as Parameters<typeof transactionEvent>[0], id)
  );

  cp.handle('MeterValues', async ({ params }: { params: unknown }) =>
    meterValues(params as Parameters<typeof meterValues>[0], id)
  );
}
