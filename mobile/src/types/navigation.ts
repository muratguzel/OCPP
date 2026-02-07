import type { ChargingData } from '../screens/ChargingActiveScreen';

export type RootStackParamList = {
  Login: undefined;
  QR: undefined;
  ChargingStart: undefined;
  ChargingActive: { chargePointId: string };
  ChargingSummary: { chargingData: ChargingData };
};
