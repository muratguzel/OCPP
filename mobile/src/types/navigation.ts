import type { ChargingData } from '../screens/ChargingActiveScreen';

export type RootStackParamList = {
  Login: undefined;
  QR: undefined;
  ChargingStart: { chargePointId?: string; chargePointName?: string };
  ChargingActive: { chargePointId: string };
  ChargingSummary: { chargingData: ChargingData; transactionId?: number | string };
  Usage: undefined;
  Account: undefined;
  PrivacyPolicy: undefined;
};
