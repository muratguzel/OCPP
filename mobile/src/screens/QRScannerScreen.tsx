import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { useLanguage } from '../contexts/LanguageContext';
import { LanguageSelector } from '../components/LanguageSelector';
import type { RootStackParamList } from '../types/navigation';

type Nav = NativeStackNavigationProp<RootStackParamList, 'QR'>;

export const QRScannerScreen: React.FC = () => {
  const { t } = useLanguage();
  const navigation = useNavigation<Nav>();

  return (
    <LinearGradient
      colors={['#000000', '#111827', '#000000']}
      style={styles.gradient}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <LanguageSelector />
      </View>
      <View style={styles.content}>
        <Text style={styles.title}>{t('scanQR')}</Text>
        <Text style={styles.instruction}>{t('scanInstruction')}</Text>
        <View style={styles.frame}>
          <View style={styles.frameInner}>
            <Text style={styles.qrPlaceholder}>📷</Text>
            <View style={styles.cornerTL} />
            <View style={styles.cornerTR} />
            <View style={styles.cornerBL} />
            <View style={styles.cornerBR} />
          </View>
        </View>
        <Text style={styles.areaHint}>{t('scanningArea')}</Text>
        <TouchableOpacity
          style={styles.scanButton}
          onPress={() => navigation.navigate('ChargingStart')}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={['#06b6d4', '#2563eb']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.scanButtonGradient}
          >
            <Text style={styles.scanButtonText}>{t('scanQR')}</Text>
          </LinearGradient>
        </TouchableOpacity>
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
  header: {
    padding: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
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
  instruction: { color: '#9ca3af', marginBottom: 32, textAlign: 'center' },
  frame: {
    width: '100%',
    maxWidth: 280,
    aspectRatio: 1,
    marginBottom: 32,
  },
  frameInner: {
    flex: 1,
    backgroundColor: 'rgba(17, 24, 39, 0.9)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#374151',
    justifyContent: 'center',
    alignItems: 'center',
  },
  qrPlaceholder: { fontSize: 80 },
  cornerTL: { ...corner, top: 12, left: 12, borderTopLeftRadius: 12 },
  cornerTR: { ...corner, top: 12, right: 12, borderTopRightRadius: 12 },
  cornerBL: { ...corner, bottom: 12, left: 12, borderBottomLeftRadius: 12 },
  cornerBR: { ...corner, bottom: 12, right: 12, borderBottomRightRadius: 12 },
  areaHint: { color: '#6b7280', fontSize: 14, marginBottom: 32 },
  scanButton: {
    width: '100%',
    maxWidth: 280,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#06b6d4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  scanButtonGradient: {
    paddingVertical: 18,
    alignItems: 'center',
  },
  scanButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});
