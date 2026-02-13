import type { ChargingData } from '../screens/ChargingActiveScreen';

export type RootStackParamList = {
  Login: undefined;
  QR: undefined;
  ChargingStart: { chargePointId?: string; chargePointName?: string };
  ChargingActive: { chargePointId: string };
  ChargingSummary: { chargingData: ChargingData };
  Usage: undefined;
};
