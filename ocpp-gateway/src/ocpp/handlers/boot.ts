/**
 * BootNotification handler - OCPP 1.6J and 2.x
 *
 * Side effect: cihaz boot/reconnect sonrasında, eğer gateway'in in-memory
 * transactions Map'i bu CP için boşsa (gateway restart olmuş veya state
 * yoksa), backend'den açık transaction'ları çekip seed ederiz. Böylece cihaz
 * offline kuyruğundan StopTransaction'ı flush ettiğinde doğru transactionId
 * memory'de olur ve stopTransaction handler onu kapatabilir.
 */
import { getChargePoint, saveTransaction } from '../../store/chargePoints.js';
import { fetchActiveTransactions } from '../../backend/client.js';

export async function bootNotification(
  chargePointId: string
): Promise<{ status: string; currentTime: string; interval: number }> {
  void hydrateActiveTransactions(chargePointId);
  return {
    status: 'Accepted',
    currentTime: new Date().toISOString(),
    interval: 300,
  };
}

async function hydrateActiveTransactions(chargePointId: string): Promise<void> {
  const cp = getChargePoint(chargePointId);
  if (!cp) return;
  if (cp.transactions.size > 0) return; // memory zaten dolu, hydrate gerekmez

  try {
    const open = await fetchActiveTransactions(chargePointId);
    if (open.length === 0) return;
    for (const tx of open) {
      saveTransaction(chargePointId, {
        transactionId: tx.ocppTransactionId,
        chargePointId,
        connectorId: tx.connectorId,
        idTag: tx.idTag,
        meterStart: tx.meterStart ?? undefined,
        startTime: tx.startTime,
      });
    }
    console.log(
      `[boot] hydrated ${open.length} open transaction(s) for ${chargePointId} from backend`
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn(`[boot] hydrate failed for ${chargePointId}: ${msg}`);
  }
}
