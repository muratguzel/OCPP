/**
 * OCPP sampledValue normalization. Handles both 1.6J (top-level `unit`) and
 * 2.x (`unitOfMeasure.unit` + `multiplier`). Applies SI unit conversion so
 * callers can rely on canonical units (Wh for energy, W for power, A for current).
 *
 * Measurand names follow OCPP spec exactly — no vendor aliases. If a device
 * is observed in the wild sending non-spec measurands, add them to the
 * extractor functions rather than here.
 */

type RawSampled = {
  value?: string | number;
  measurand?: string;
  unit?: string; // OCPP 1.6J
  phase?: string;
  context?: string;
  location?: string;
  unitOfMeasure?: { unit?: string; multiplier?: number | string }; // OCPP 2.x
};

type RawMeterValue = {
  timestamp?: string;
  sampledValue?: unknown[];
};

export type NormalizedSample = {
  measurand: string;
  value: number; // multiplier-applied
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

const CURRENT_TO_A: Record<string, number> = {
  A: 1,
  mA: 0.001,
};

function defaultUnitFor(measurand: string): string {
  if (measurand.startsWith('Energy.')) return 'Wh';
  if (measurand.startsWith('Power.')) return 'W';
  if (measurand.startsWith('Current.')) return 'A';
  if (measurand.startsWith('Voltage')) return 'V';
  if (measurand === 'Frequency') return 'Hz';
  if (measurand === 'Temperature') return 'Celsius';
  if (measurand === 'SoC') return 'Percent';
  return '';
}

export function normalizeSample(raw: unknown): NormalizedSample | null {
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

export function toWh(s: NormalizedSample): number | null {
  if (!s.measurand.startsWith('Energy.')) return null;
  const factor = ENERGY_TO_WH[s.unit];
  return factor != null ? s.value * factor : null;
}

export function toW(s: NormalizedSample): number | null {
  if (!s.measurand.startsWith('Power.')) return null;
  const factor = POWER_TO_W[s.unit];
  return factor != null ? s.value * factor : null;
}

export function toA(s: NormalizedSample): number | null {
  if (!s.measurand.startsWith('Current.')) return null;
  const factor = CURRENT_TO_A[s.unit];
  return factor != null ? s.value * factor : null;
}

/** Flatten OCPP meterValue list `[{timestamp, sampledValue[]}, ...]` into NormalizedSample[]. */
export function flattenMeterValues(list: unknown): NormalizedSample[] {
  if (!Array.isArray(list)) return [];
  const out: NormalizedSample[] = [];
  for (const item of list) {
    const sv = (item as RawMeterValue)?.sampledValue;
    if (!Array.isArray(sv)) continue;
    for (const raw of sv) {
      const n = normalizeSample(raw);
      if (n) out.push(n);
    }
  }
  return out;
}

/**
 * Flatten a single `meterValues[].values` entry from the in-memory store.
 * The store accepts either OCPP 1.6 nested form (`[{timestamp, sampledValue[]}, ...]`)
 * or OCPP 2.x flat form (`sampledValue[]` directly) depending on which handler wrote it.
 */
export function flattenStoredValues(values: unknown): NormalizedSample[] {
  if (!Array.isArray(values)) return [];
  const out: NormalizedSample[] = [];
  for (const item of values) {
    const row = item as { sampledValue?: unknown[] };
    if (row && Array.isArray(row.sampledValue)) {
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

/**
 * Cumulative energy register (Energy.Active.Import.Register) in Wh.
 * Prefers Transaction.End context, else any non-Transaction.Begin sample.
 */
export function extractEnergyRegisterWh(samples: NormalizedSample[]): number | null {
  const registers = samples.filter((s) => s.measurand === 'Energy.Active.Import.Register');
  if (registers.length === 0) return null;
  const endCtx = registers.find((s) => s.context === 'Transaction.End');
  const target = endCtx ?? registers.find((s) => s.context !== 'Transaction.Begin') ?? registers[0];
  return toWh(target);
}
