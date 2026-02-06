import { RPCServer } from 'ocpp-rpc';
import {
  registerChargePoint,
  unregisterChargePoint,
} from '../store/chargePoints.js';
import { registerClient, unregisterClient } from './clients.js';
import { attachHandlers } from './handlers/index.js';

export function createOcppServer(port: number): RPCServer {
  const server = new RPCServer({
    protocols: ['ocpp1.6', 'ocpp2.0.1', 'ocpp2.1'],
    strictMode: false,
  });

  server.on('client', (client: { identity: string; protocol?: string; call: (method: string, params: unknown) => Promise<unknown>; handle: (a: string, f: (p: { params: unknown }) => unknown) => void; on: (e: string, f: () => void) => void }) => {
    const id = client.identity;
    const protocol = client.protocol ?? 'ocpp1.6';
    registerChargePoint(id, protocol);
    registerClient(id, {
      identity: id,
      protocol,
      call: client.call.bind(client),
    });
    console.log('[OCPP] Charge point connected:', id, protocol);

    client.on('close', () => {
      unregisterChargePoint(id);
      unregisterClient(id);
      console.log('[OCPP] Charge point disconnected:', id);
    });

    attachHandlers(client as Parameters<typeof attachHandlers>[0]);
  });

  return server;
}

export async function listenOcppServer(server: RPCServer, port: number): Promise<void> {
  await server.listen(port);
  console.log('[OCPP] WebSocket server listening on port', port);
}
