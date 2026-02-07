import React, { useState } from 'react';
import { Alert } from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { ChargingActiveScreen } from './ChargingActiveScreen';
import { ChargingEndScreen } from './ChargingEndScreen';
import { remoteStop } from '../api/ocppGateway';
import type { ChargingData } from './ChargingActiveScreen';
import type { RootStackParamList } from '../types/navigation';
import { useLanguage } from '../contexts/LanguageContext';

export const ChargingActiveStackScreen: React.FC = () => {
  const { t } = useLanguage();
  const route = useRoute<RouteProp<RootStackParamList, 'ChargingActive'>>();
  const navigation = useNavigation();
  const chargePointId = route.params?.chargePointId ?? '';
  const [showEndModal, setShowEndModal] = useState(false);
  const [stopData, setStopData] = useState<{
    chargingData: ChargingData;
    transactionId: number | string;
  } | null>(null);

  const handleStopCharging = (data: ChargingData, transactionId: number | string) => {
    setStopData({ chargingData: data, transactionId });
    setShowEndModal(true);
  };

  const handleConfirmStop = async () => {
    if (!stopData || !chargePointId) return;
    setShowEndModal(false);
    try {
      await remoteStop({ chargePointId, transactionId: stopData.transactionId });
      (navigation as unknown as { navigate: (a: string, b: object) => void }).navigate(
        'ChargingSummary',
        { chargingData: stopData.chargingData }
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      Alert.alert(t('stationInfo'), msg);
    }
    setStopData(null);
  };

  const handleCancelStop = () => {
    setShowEndModal(false);
    setStopData(null);
  };

  return (
    <>
      <ChargingActiveScreen
        chargePointId={chargePointId}
        onStopCharging={handleStopCharging}
      />
      <ChargingEndScreen
        visible={showEndModal}
        onCancel={handleCancelStop}
        onConfirm={handleConfirmStop}
      />
    </>
  );
};
