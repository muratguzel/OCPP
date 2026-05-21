import React, { useState, useEffect, useRef } from 'react';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { ChargingActiveScreen } from './ChargingActiveScreen';
import { ChargingEndScreen } from './ChargingEndScreen';
import { stopCharge, STORAGE_KEYS } from '../api/backendApi';
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
  // Guards against double-navigation when user-stop and charger-stop race each other.
  const navigatedRef = useRef<boolean>(false);

  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e) => {
      // Prevent taking the user back if we are charging
      if (e.data.action.type === 'GO_BACK') {
        e.preventDefault();
        Alert.alert(
          t('stationInfo'),
          typeof t('chargingInProgress') === 'string' ? t('chargingInProgress') : 'Lütfen önce şarj işlemini durdurun.',
          [{ text: 'Tamam' }]
        );
      }
    });
    return unsubscribe;
  }, [navigation, t]);

  const handleStopCharging = (data: ChargingData, transactionId: number | string) => {
    setStopData({ chargingData: data, transactionId });
    setShowEndModal(true);
  };

  const handleConfirmStop = async () => {
    if (!stopData || !chargePointId) return;
    setShowEndModal(false);
    try {
      await stopCharge({ chargePointId, transactionId: stopData.transactionId });
      await AsyncStorage.removeItem(STORAGE_KEYS.ACTIVE_CHARGE_POINT_ID);
      if (navigatedRef.current) {
        setStopData(null);
        return;
      }
      navigatedRef.current = true;
      (navigation as unknown as { navigate: (a: string, b: object) => void }).navigate(
        'ChargingSummary',
        { chargingData: stopData.chargingData, transactionId: stopData.transactionId }
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (!navigatedRef.current) Alert.alert(t('stationInfo'), msg);
    }
    setStopData(null);
  };

  const handleCancelStop = () => {
    setShowEndModal(false);
    setStopData(null);
  };

  // Charger ended the session on its own (cable unplug, RFID, etc.).
  // Skip the stop API call (gateway already closed the transaction) and the confirm modal.
  const handleChargingEnded = async (
    data: ChargingData,
    transactionId: number | string | null
  ) => {
    if (navigatedRef.current) return;
    navigatedRef.current = true;
    setShowEndModal(false);
    setStopData(null);
    await AsyncStorage.removeItem(STORAGE_KEYS.ACTIVE_CHARGE_POINT_ID);
    (navigation as unknown as { navigate: (a: string, b: object) => void }).navigate(
      'ChargingSummary',
      { chargingData: data, transactionId: transactionId ?? undefined }
    );
  };

  return (
    <>
      <ChargingActiveScreen
        chargePointId={chargePointId}
        onStopCharging={handleStopCharging}
        onChargingEnded={handleChargingEnded}
      />
      <ChargingEndScreen
        visible={showEndModal}
        onCancel={handleCancelStop}
        onConfirm={handleConfirmStop}
      />
    </>
  );
};
