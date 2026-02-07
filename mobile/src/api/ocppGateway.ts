import { OCPP_GATEWAY_URL, DEFAULT_ID_TAG } from '../constants/config';

const base = () => OCPP_GATEWAY_URL;

export interface ChargePoint {
  chargePointId: string;
  protocol: string;
  connectedAt: string;
  connectorCount: number;
}

export interface Transaction {
  transactionId: number | string;
  connectorId: number;
  idTag: string;
  startTime: string;
  endTime?: string;
  meterStart?: number;
  meterStop?: number;
  meterValueCount?: number;
}

export interface MeterValueItem {
  timestamp: string;
  values: unknown;
}

export interface MetersResponse {
  chargePointId: string;
  transactionId: number | string;
  meterStart?: number;
  meterStop?: number;
  count: number;
  meterValues: MeterValueItem[];
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${base()}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  const data = (await res.json().catch(() => ({}))) as T & { error?: string; message?: string };
  if (!res.ok) {
    const msg = data.error || data.message || res.statusText || 'Request failed';
    throw new Error(typeof msg === 'string' ? msg : JSON.stringify(msg));
  }
  return data;
}

export async function getChargePoints(): Promise<{ chargePoints: ChargePoint[] }> {
  return request<{ chargePoints: ChargePoint[] }>('/charge-points');
}

export async function remoteStart(params: {
  chargePointId: string;
  idTag?: string;
  connectorId?: number;
}): Promise<{ success: boolean; status: string; chargePointId: string }> {
  return request<{ success: boolean; status: string; chargePointId: string }>(
    '/remote-start',
    {
      method: 'POST',
      body: JSON.stringify({
        chargePointId: params.chargePointId,
        idTag: params.idTag ?? DEFAULT_ID_TAG,
        connectorId: params.connectorId ?? 1,
      }),
    }
  );
}

export async function remoteStop(params: {
  chargePointId: string;
  transactionId: number | string;
}): Promise<{ success: boolean; status: string }> {
  return request<{ success: boolean; status: string }>('/remote-stop', {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

export async function getTransactions(
  chargePointId: string
): Promise<{ chargePointId: string; transactions: Transaction[] }> {
  return request<{ chargePointId: string; transactions: Transaction[] }>(
    `/charge-points/${encodeURIComponent(chargePointId)}/transactions`
  );
}

export async function getMeters(
  chargePointId: string,
  transactionId: number | string,
  options?: { limit?: number; since?: string }
): Promise<MetersResponse> {
  const q = new URLSearchParams();
  if (options?.limit != null) q.set('limit', String(options.limit));
  if (options?.since) q.set('since', options.since);
  const query = q.toString();
  return request<MetersResponse>(
    `/charge-points/${encodeURIComponent(chargePointId)}/transactions/${encodeURIComponent(String(transactionId))}/meters${query ? `?${query}` : ''}`
  );
}
