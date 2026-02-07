import type { MetersResponse } from '../api/ocppGateway';

/** OCPP sampledValue-like item (1.6 / 2.x). */
interface SampledValue {
  measurand?: string;
  value?: string | number;
  unitOfMeasure?: { unit?: string; multiplier?: number };
}

/**
 * Extract energy in kWh from meter values.
 * Looks for Energy.Active.Import.Register (Wh or kWh).
 */
export function parseEnergyKwh(meters: MetersResponse): number {
  const raw = lastMeterValues(meters);
  if (!raw) return meters.meterStart != null ? meters.meterStart / 1000 : 0;
  const energyWh = findMeasurand(raw, [
    'Energy.Active.Import.Register',
    'Energy.Active.Import',
  ]);
  if (energyWh == null) return meters.meterStart != null ? meters.meterStart / 1000 : 0;
  const num = typeof energyWh === 'number' ? energyWh : Number(energyWh);
  return num >= 1000 ? num / 1000 : num; // assume Wh if small
}

/**
 * Extract current power in kW from meter values.
 * Looks for Power.Active.Import (W or kW).
 */
export function parsePowerKw(meters: MetersResponse): number | null {
  const raw = lastMeterValues(meters);
  if (!raw) return null;
  const powerW = findMeasurand(raw, [
    'Power.Active.Import',
    'Power.Active',
  ]);
  if (powerW == null) return null;
  const num = typeof powerW === 'number' ? powerW : Number(powerW);
  return num >= 1000 ? num / 1000 : num;
}

function lastMeterValues(meters: MetersResponse): unknown {
  const list = meters.meterValues;
  if (!list?.length) return undefined;
  return list[list.length - 1]?.values;
}

function findMeasurand(
  values: unknown,
  measurands: string[]
): number | string | undefined {
  const sampled = flattenSampledValues(values);
  for (const m of measurands) {
    for (const sv of sampled) {
      if (sv?.measurand === m && (sv.value !== undefined && sv.value !== '')) {
        return typeof sv.value === 'number' ? sv.value : String(sv.value);
      }
    }
  }
  return undefined;
}

/** OCPP sends meterValue as array of { timestamp, sampledValue[] }. Flatten to sampledValue[]. */
function flattenSampledValues(values: unknown): SampledValue[] {
  if (!Array.isArray(values)) return [];
  const out: SampledValue[] = [];
  for (const item of values) {
    const row = item as { sampledValue?: unknown[] };
    if (Array.isArray(row?.sampledValue)) {
      for (const sv of row.sampledValue) {
        out.push(sv as SampledValue);
      }
    } else if (row && typeof row === 'object' && 'measurand' in row) {
      out.push(row as SampledValue);
    }
  }
  return out;
}
