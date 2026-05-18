/**
 * Parses OCPP sampledValue entries stored by the gateway. Handles both
 * 1.6J (top-level `unit`) and 2.x (`unitOfMeasure.unit` + `multiplier`).
 *
 * Replaces the previous `>=1000 ise Wh varsay` heuristic which silently
 * gave wrong results when the device sent kWh or used a multiplier.
 * Canonical units: energy → Wh, power → W. Callers convert to display unit.
 */
import type { MetersResponse, MeterValueItem } from '../api/ocppGateway';

type RawSampled = {
  value?: string | number;
  measurand?: string;
  unit?: string;
  phase?: string;
  context?: string;
  location?: string;
  unitOfMeasure?: { unit?: string; multiplier?: number | string };
};

type NormalizedSample = {
  measurand: string;
  value: number;
  unit: string;
  phase?: string;
  context: string;
};

const DEFAULT_MEASURAND = 'Energy.Active.Import.Register';
const DEFAULT_CONTEXT = 'Sample.Periodic';

const ENERGY_TO_WH: Record<string, number> = {
  Wh: 1,
  kWh: 1000,
  MWh: 1_000_000,
};

const POWER_TO_W: Record<string, number> = {
  W: 1,
  kW: 1000,
  VA: 1,
  kVA: 1000,
};

function defaultUnitFor(measurand: string): string {
  if (measurand.startsWith('Energy.')) return 'Wh';
  if (measurand.startsWith('Power.')) return 'W';
  if (measurand.startsWith('Current.')) return 'A';
  if (measurand.startsWith('Voltage')) return 'V';
  return '';
}

function normalizeSample(raw: unknown): NormalizedSample | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as RawSampled;
  if (r.value === undefined || r.value === null || r.value === '') return null;

  const numericValue = typeof r.value === 'number' ? r.value : Number(r.value);
  if (!Number.isFinite(numericValue)) return null;

  const multiplierRaw = r.unitOfMeasure?.multiplier;
  const multiplier =
    multiplierRaw != null && Number.isFinite(Number(multiplierRaw)) ? Number(multiplierRaw) : 0;
  const value = multiplier !== 0 ? numericValue * Math.pow(10, multiplier) : numericValue;

  const measurand = r.measurand ?? DEFAULT_MEASURAND;
  const unit = r.unitOfMeasure?.unit ?? r.unit ?? defaultUnitFor(measurand);

  return {
    measurand,
    value,
    unit,
    phase: r.phase,
    context: r.context ?? DEFAULT_CONTEXT,
  };
}

function toWh(s: NormalizedSample): number | null {
  if (!s.measurand.startsWith('Energy.')) return null;
  const factor = ENERGY_TO_WH[s.unit];
  return factor != null ? s.value * factor : null;
}

function toW(s: NormalizedSample): number | null {
  if (!s.measurand.startsWith('Power.')) return null;
  const factor = POWER_TO_W[s.unit];
  return factor != null ? s.value * factor : null;
}

/**
 * Flatten a single `meterValues[].values` entry. The gateway stores two shapes:
 * - From OCPP 1.6 MeterValues: array of `{timestamp, sampledValue[]}` (nested)
 * - From OCPP 2.x TransactionEvent Updated: array of sampledValue directly (flat)
 */
function flattenOne(values: unknown): NormalizedSample[] {
  if (!Array.isArray(values)) return [];
  const out: NormalizedSample[] = [];
  for (const item of values) {
    const row = item as { sampledValue?: unknown[] };
    if (Array.isArray(row?.sampledValue)) {
      for (const sv of row.sampledValue) {
        const n = normalizeSample(sv);
        if (n) out.push(n);
      }
    } else {
      const n = normalizeSample(item);
      if (n) out.push(n);
    }
  }
  return out;
}

function latestSamples(meters: MetersResponse): NormalizedSample[] {
  const list = meters.meterValues;
  if (!list?.length) return [];
  const last: MeterValueItem = list[list.length - 1];
  return flattenOne(last.values);
}

/** Energy delivered in this session, in kWh.
 *  Register is cumulative (lifetime meter total), so subtract meterStart (Wh) to get session delta. */
export function parseEnergyKwh(meters: MetersResponse): number {
  const meterStartWh = meters.meterStart ?? 0;
  const samples = latestSamples(meters);
  const registers = samples.filter(
    (s) => s.measurand === 'Energy.Active.Import.Register' && s.context !== 'Transaction.Begin'
  );
  if (registers.length > 0) {
    const wh = toWh(registers[registers.length - 1]);
    if (wh != null) return Math.max(0, wh - meterStartWh) / 1000;
  }
  return 0;
}

/** Instantaneous power in kW. Prefers Power.Active.Import without phase (total);
 *  else sums L1+L2+L3 if available. Null if no power sample present. */
export function parsePowerKw(meters: MetersResponse): number | null {
  const samples = latestSamples(meters);
  const powers = samples.filter(
    (s) => s.measurand === 'Power.Active.Import' && s.context !== 'Transaction.Begin'
  );
  if (powers.length === 0) return null;

  const total = powers.find((s) => !s.phase);
  if (total) {
    const w = toW(total);
    return w != null ? w / 1000 : null;
  }

  const phaseW: number[] = [];
  for (const phase of ['L1', 'L2', 'L3']) {
    const found = powers.find((s) => s.phase === phase);
    if (found) {
      const w = toW(found);
      if (w != null) phaseW.push(w);
    }
  }
  if (phaseW.length === 0) return null;
  return phaseW.reduce((a, b) => a + b, 0) / 1000;
}
