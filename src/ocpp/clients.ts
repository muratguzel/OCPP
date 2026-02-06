/**
 * Registry of connected OCPP clients (charge points).
 * Used to send RemoteStartTransaction / RequestStopTransaction etc. to a specific CP.
 */

export type OcppClient = {
  identity: string;
  protocol: string;
  call: (method: string, params: unknown) => Promise<unknown>;
};

const clients = new Map<string, OcppClient>();

export function registerClient(identity: string, client: OcppClient): void {
  clients.set(identity, client);
}

export function unregisterClient(identity: string): void {
  clients.delete(identity);
}

export function getClient(identity: string): OcppClient | undefined {
  const exact = clients.get(identity);
  if (exact) return exact;
  const lower = identity.toLowerCase();
  for (const [id, client] of clients) {
    if (id.toLowerCase() === lower) return client;
  }
  return undefined;
}

/** İstekte kullanılan chargePointId için kayıtlı (gerçek) identity. Case-insensitive eşleşmede farklı olabilir. */
export function getStoredIdentity(chargePointId: string): string | undefined {
  if (clients.has(chargePointId)) return chargePointId;
  const lower = chargePointId.toLowerCase();
  for (const id of clients.keys()) {
    if (id.toLowerCase() === lower) return id;
  }
  return undefined;
}

export function getConnectedIdentities(): string[] {
  return Array.from(clients.keys());
}
