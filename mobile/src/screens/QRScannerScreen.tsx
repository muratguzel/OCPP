import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { LanguageSelector } from '../components/LanguageSelector';
import type { RootStackParamList } from '../types/navigation';

type Nav = NativeStackNavigationProp<RootStackParamList, 'QR'>;

interface QRPayload {
  chargePointId?: string;
  name?: string;
}

function parseQRData(data: string): QRPayload | null {
  try {
    const parsed = JSON.parse(data) as QRPayload;
    if (parsed && typeof parsed.chargePointId === 'string') {
      return parsed;
    }
  } catch {
    // Not JSON, treat as plain chargePointId
    if (data.trim()) {
      return { chargePointId: data.trim(), name: data.trim() };
    }
  }
  return null;
}

export const QRScannerScreen: React.FC = () => {
  const { t } = useLanguage();
  const { logout } = useAuth();
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);

  const handleBarCodeScanned = useCallback(
    ({ data }: { type: string; data: string }) => {
      if (scanned) return;
      setScanned(true);

      const payload = parseQRData(data);
      if (!payload?.chargePointId) {
        Alert.alert(t('stationInfo') || 'Invalid QR', 'This QR code is not a valid charge station code.');
        setScanned(false);
        return;
      }

      navigation.navigate('ChargingStart', {
        chargePointId: payload.chargePointId,
        chargePointName: payload.name,
      });
      // Reset after navigation so user can scan again when they come back
      setTimeout(() => setScanned(false), 1000);
    },
    [navigation, scanned, t]
  );

  if (!permission) {
    return (
      <View style={styles.centered}>
        <Text style={styles.loadingText}>Loading camera...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <LinearGradient colors={['#000000', '#111827', '#000000']} style={styles.gradient}>
        <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
          <View style={styles.backButton} />
          <View style={styles.headerRight}>
            <TouchableOpacity onPress={() => logout()} style={styles.logoutButton}>
              <Text style={styles.logoutButtonText}>{t('logout')}</Text>
            </TouchableOpacity>
            <LanguageSelector />
          </View>
        </View>
        <View style={styles.content}>
          <Text style={styles.title}>{t('scanQR')}</Text>
          <Text style={styles.permissionText}>
            Camera permission is required to scan QR codes.
          </Text>
          <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
            <Text style={styles.permissionButtonText}>Grant Permission</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={['#000000', '#111827', '#000000']}
      style={styles.gradient}
    >
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerRight}>
          <TouchableOpacity
            onPress={() => navigation.navigate('Usage')}
            style={styles.usageButton}
          >
            <Text style={styles.usageButtonText}>My Usage</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => logout()}
            style={styles.logoutButton}
          >
            <Text style={styles.logoutButtonText}>{t('logout')}</Text>
          </TouchableOpacity>
          <LanguageSelector />
        </View>
      </View>
      <View style={styles.content}>
        <Text style={styles.title}>{t('scanQR')}</Text>
        <Text style={styles.instruction}>{t('scanInstruction')}</Text>
        <View style={styles.cameraContainer}>
          <CameraView
            style={styles.camera}
            facing="back"
            barcodeScannerSettings={{
              barcodeTypes: ['qr'],
            }}
            onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
          />
          <View style={styles.overlay} pointerEvents="none">
            <View style={styles.cornerTL} />
            <View style={styles.cornerTR} />
            <View style={styles.cornerBL} />
            <View style={styles.cornerBR} />
          </View>
        </View>
        <Text style={styles.areaHint}>{t('scanningArea')}</Text>
        {scanned && (
          <TouchableOpacity
            style={styles.rescanButton}
            onPress={() => setScanned(false)}
          >
            <Text style={styles.rescanButtonText}>Tap to Scan Again</Text>
          </TouchableOpacity>
        )}
      </View>
    </LinearGradient>
  );
};

const corner = {
  position: 'absolute' as const,
  width: 32,
  height: 32,
  borderColor: '#22d3ee',
  borderWidth: 3,
};

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  loadingText: { color: '#9ca3af' },
  header: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  usageButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(34, 211, 238, 0.2)',
    borderRadius: 10,
  },
  usageButtonText: { color: '#22d3ee', fontWeight: '600', fontSize: 14 },
  logoutButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderRadius: 10,
  },
  logoutButtonText: { color: '#f87171', fontWeight: '600', fontSize: 14 },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1f2937',
    borderWidth: 1,
    borderColor: '#374151',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIcon: { color: '#fff', fontSize: 24 },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingBottom: 48,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 12,
  },
  instruction: { color: '#9ca3af', marginBottom: 24, textAlign: 'center' },
  permissionText: { color: '#9ca3af', marginBottom: 16, textAlign: 'center' },
  permissionButton: {
    backgroundColor: '#2563eb',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  permissionButtonText: { color: '#fff', fontWeight: '600' },
  cameraContainer: {
    width: '100%',
    maxWidth: 280,
    aspectRatio: 1,
    overflow: 'hidden',
    borderRadius: 24,
    marginBottom: 24,
  },
  camera: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cornerTL: { ...corner, top: 12, left: 12, borderTopLeftRadius: 12 },
  cornerTR: { ...corner, top: 12, right: 12, borderTopRightRadius: 12 },
  cornerBL: { ...corner, bottom: 12, left: 12, borderBottomLeftRadius: 12 },
  cornerBR: { ...corner, bottom: 12, right: 12, borderBottomRightRadius: 12 },
  areaHint: { color: '#6b7280', fontSize: 14, marginBottom: 16 },
  rescanButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: '#374151',
    borderRadius: 12,
  },
  rescanButtonText: { color: '#fff', fontWeight: '600' },
});
