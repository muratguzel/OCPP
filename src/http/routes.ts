import { Router, Request, Response } from 'express';
import {
  getConnectedCount,
  getAllChargePoints,
  getChargePointByIdentity,
} from '../store/chargePoints.js';
import { getClient, getConnectedIdentities } from '../ocpp/clients.js';

const router = Router();

router.get('/health', (_req, res) => {
  const connectedChargePoints = getConnectedCount();
  res.status(200).json({
    status: 'ok',
    service: 'ocpp-gateway',
    connectedChargePoints,
  });
});

/**
 * Bağlı tüm charge point'leri listeler (remote-start/stop için chargePointId almak üzere).
 */
router.get('/charge-points', (_req, res) => {
  const list = getAllChargePoints().map((cp) => ({
    chargePointId: cp.chargePointId,
    protocol: cp.protocol,
    connectedAt: cp.connectedAt,
    connectorCount: cp.connectors.size,
  }));
  res.status(200).json({ chargePoints: list });
});

/**
 * Bağlı bir CP'ye uzaktan şarj başlatma komutu gönderir.
 * Body: { chargePointId: string, idTag: string, connectorId?: number }
 * OCPP 1.6 → RemoteStartTransaction; OCPP 2.x → RequestStartTransaction
 */
router.post('/remote-start', async (req: Request, res: Response) => {
  const { chargePointId, idTag, connectorId } = req.body as { chargePointId?: string; idTag?: string; connectorId?: number };
  if (!chargePointId || !idTag) {
    return res.status(400).json({
      error: 'Missing chargePointId or idTag',
      body: { chargePointId: 'string', idTag: 'string', connectorId: 'number (optional)' },
    });
  }

  const client = getClient(chargePointId);
  if (!client) {
    const connected = getConnectedIdentities();
    return res.status(404).json({
      error: 'Charge point not connected',
      chargePointId,
      hint: 'Identity = WebSocket URL last path segment (e.g. ws://host:9220/CP001). No trailing slash. Check GET /charge-points for connected IDs.',
      connectedChargePointIds: connected.length ? connected : undefined,
    });
  }

  try {
    const is16 = client.protocol === 'ocpp1.6';
    const result = is16
      ? await client.call('RemoteStartTransaction', {
          idTag,
          connectorId: connectorId ?? 1,
        })
      : await client.call('RequestStartTransaction', {
          idToken: { idToken: idTag, type: 'Central' },
          ...(connectorId != null && { evseId: connectorId }),
        });

    const status = (result as { status?: string })?.status ?? 'Unknown';
    return res.status(200).json({
      success: status === 'Accepted',
      status,
      chargePointId,
      protocol: client.protocol,
      raw: result,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return res.status(502).json({
      error: 'OCPP call failed',
      chargePointId,
      message,
    });
  }
});

/**
 * Bağlı bir CP'ye uzaktan şarj durdurma komutu gönderir.
 * Body: { chargePointId: string, transactionId: number | string }
 * OCPP 1.6 → RemoteStopTransaction; OCPP 2.x → RequestStopTransaction
 */
router.post('/remote-stop', async (req: Request, res: Response) => {
  const { chargePointId, transactionId } = req.body as { chargePointId?: string; transactionId?: number | string };
  if (!chargePointId || transactionId === undefined) {
    return res.status(400).json({
      error: 'Missing chargePointId or transactionId',
      body: { chargePointId: 'string', transactionId: 'number | string' },
    });
  }

  const client = getClient(chargePointId);
  if (!client) {
    const connected = getConnectedIdentities();
    return res.status(404).json({
      error: 'Charge point not connected',
      chargePointId,
      hint: 'Check GET /charge-points for connected IDs. Identity = last path segment of CP WebSocket URL.',
      connectedChargePointIds: connected.length ? connected : undefined,
    });
  }

  try {
    const is16 = client.protocol === 'ocpp1.6';
    const result = is16
      ? await client.call('RemoteStopTransaction', { transactionId })
      : await client.call('RequestStopTransaction', { transactionId: String(transactionId) });

    const status = (result as { status?: string })?.status ?? 'Unknown';
    return res.status(200).json({
      success: status === 'Accepted',
      status,
      chargePointId,
      transactionId,
      protocol: client.protocol,
      raw: result,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return res.status(502).json({
      error: 'OCPP call failed',
      chargePointId,
      message,
    });
  }
});

/**
 * Bir CP'ye ait tüm transaction'ları listeler (StartTransaction sonrası polling için transactionId alınır).
 * GET /charge-points/:chargePointId/transactions
 * chargePointId büyük/küçük harf duyarsız eşleşir.
 */
router.get('/charge-points/:chargePointId/transactions', (req: Request, res: Response) => {
  const { chargePointId } = req.params;
  const cp = getChargePointByIdentity(chargePointId);
  if (!cp) {
    return res.status(404).json({
      error: 'Charge point not found',
      chargePointId,
      hint: 'Check GET /charge-points for connected IDs.',
    });
  }
  const list = Array.from(cp.transactions.values()).map((tx) => ({
    transactionId: tx.transactionId,
    connectorId: tx.connectorId,
    idTag: tx.idTag,
    startTime: tx.startTime,
    endTime: tx.endTime,
    meterStart: tx.meterStart,
    meterStop: tx.meterStop,
    meterValueCount: tx.meterValues.length,
  }));
  return res.status(200).json({ chargePointId: cp.chargePointId, transactions: list });
});

/**
 * Belirli bir transaction'ın meter değerlerini döner. StartTransaction sonrası düzenli aralıklarla poll edilebilir.
 * Query: ?limit=100 (son N kayıt), ?since=ISO8601 (bu tarihten sonraki kayıtlar)
 * GET /charge-points/:chargePointId/transactions/:transactionId/meters
 */
router.get('/charge-points/:chargePointId/transactions/:transactionId/meters', (req: Request, res: Response) => {
  const { chargePointId, transactionId } = req.params;
  const limit = req.query.limit != null ? Math.min(Number(req.query.limit), 1000) : undefined;
  const since = typeof req.query.since === 'string' ? req.query.since : undefined;

  const cp = getChargePointByIdentity(chargePointId);
  if (!cp) {
    return res.status(404).json({
      error: 'Charge point not found',
      chargePointId,
      hint: 'Check GET /charge-points for connected IDs.',
    });
  }
  const tx =
    cp.transactions.get(transactionId) ??
    (Number.isFinite(Number(transactionId)) ? cp.transactions.get(Number(transactionId)) : undefined);
  if (!tx) {
    return res.status(404).json({
      error: 'Transaction not found',
      chargePointId: cp.chargePointId,
      transactionId,
    });
  }

  let values = tx.meterValues;
  if (since) {
    values = values.filter((v) => v.timestamp >= since);
  }
  if (limit != null && limit > 0) {
    values = values.slice(-limit);
  }

  return res.status(200).json({
    chargePointId: cp.chargePointId,
    transactionId,
    meterStart: tx.meterStart,
    meterStop: tx.meterStop,
    count: values.length,
    meterValues: values,
  });
});

/**
 * CP'den anlık MeterValues göndermesini tetikler (OCPP TriggerMessage).
 * CP yanıt verince meter değerleri transaction'a eklenir; GET .../meters ile alınabilir.
 * Body: { connectorId?: number } (OCPP 1.6) veya { evseId?: number, connectorId?: number } (OCPP 2.x)
 */
router.post('/charge-points/:chargePointId/trigger-meter', async (req: Request, res: Response) => {
  const { chargePointId } = req.params;
  const { connectorId, evseId } = (req.body as { connectorId?: number; evseId?: number }) ?? {};

  const client = getClient(chargePointId);
  if (!client) {
    const connected = getConnectedIdentities();
    return res.status(404).json({
      error: 'Charge point not connected',
      chargePointId,
      connectedChargePointIds: connected.length ? connected : undefined,
    });
  }

  try {
    const is16 = client.protocol === 'ocpp1.6';
    const result = is16
      ? await client.call('TriggerMessage', { requestedMessage: 'MeterValues', connectorId })
      : await client.call('TriggerMessage', {
          requestedMessage: 'MeterValues',
          ...(evseId != null || connectorId != null
            ? { evse: { id: evseId ?? connectorId ?? 1, connectorId } }
            : {}),
        });

    const status = (result as { status?: string })?.status ?? 'Unknown';
    return res.status(200).json({
      success: status === 'Accepted',
      status,
      chargePointId,
      hint: 'CP will send MeterValues; poll GET .../transactions/:transactionId/meters to read values.',
      raw: result,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return res.status(502).json({
      error: 'TriggerMessage failed',
      chargePointId,
      message,
    });
  }
});

export default router;
