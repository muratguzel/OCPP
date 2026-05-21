import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { LanguageSelector } from '../components/LanguageSelector';
import { downloadReceiptPdf } from '../api/backendApi';
import type { RootStackParamList } from '../types/navigation';
import type { ChargingData } from './ChargingActiveScreen';

type Nav = NativeStackNavigationProp<RootStackParamList, 'ChargingSummary'>;
type Route = RouteProp<RootStackParamList, 'ChargingSummary'>;

export const ChargingSummaryScreen: React.FC = () => {
  const { t, isRTL } = useLanguage();
  const { user } = useAuth();
  const route = useRoute<Route>();
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const chargingData = route.params?.chargingData;
  const transactionId = route.params?.transactionId;
  const [downloading, setDownloading] = useState(false);
  if (!chargingData) return null;
  const { duration, energyUsed, cost, startTime } = chargingData;
  const endTime = new Date(startTime.getTime() + duration * 1000);

  const handleDownloadReceipt = async () => {
    if (downloading) return;
    if (transactionId == null) {
      Alert.alert('Hata', 'Fiş bilgisi mevcut değil');
      return;
    }
    setDownloading(true);
    try {
      // Lazy import: eski native binary'de (OTA güncellemesi binary'i eski iken)
      // expo-sharing/expo-file-system yoksa ekran mount'unda crash olmasın diye.
      let Sharing: typeof import('expo-sharing');
      try {
        Sharing = await import('expo-sharing');
      } catch {
        Alert.alert(
          'Güncelleme Gerekli',
          'Fiş indirme özelliği için lütfen uygulamayı en son sürüme güncelleyin.'
        );
        return;
      }
      const uri = await downloadReceiptPdf(transactionId);
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: t('downloadReceipt'),
          UTI: 'com.adobe.pdf',
        });
      } else {
        Alert.alert(t('downloadReceipt'), uri);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('native module') || msg.includes('NativeModule')) {
        Alert.alert(
          'Güncelleme Gerekli',
          'Fiş indirme özelliği için lütfen uygulamayı en son sürüme güncelleyin.'
        );
      } else {
        Alert.alert('Hata', msg);
      }
    } finally {
      setDownloading(false);
    }
  };

  const formatDuration = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m ${s}s`;
  };

  const formatTime = (date: Date) =>
    date.toLocaleTimeString(isRTL ? 'ar' : undefined, {
      hour: '2-digit',
      minute: '2-digit',
    });

  return (
    <LinearGradient
      colors={['#000000', '#111827', '#1f2937']}
      style={styles.gradient}
    >
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <LanguageSelector />
      </View>
      <View style={styles.headerTitle}>
        <View style={styles.successIconWrap}>
          <View style={styles.successIcon}>
            <Text style={styles.successIconText}>✓</Text>
          </View>
        </View>
        <Text style={styles.title}>{t('chargingComplete')}</Text>
        <Text style={styles.subtitle}>{t('summary')}</Text>
      </View>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.costCard}>
          <Text style={styles.costLabel}>{t('finalCost')}</Text>
          <Text style={styles.costValue}>₺{cost.toFixed(2)}</Text>
        </View>
        <View style={styles.details}>
          <View style={styles.detailRow}>
            <Text style={styles.detailIcon}>🕐</Text>
            <View style={styles.detailBody}>
              <Text style={styles.detailLabel}>{t('totalDuration')}</Text>
              <Text style={styles.detailValue}>{formatDuration(duration)}</Text>
            </View>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailIcon}>🔋</Text>
            <View style={styles.detailBody}>
              <Text style={styles.detailLabel}>{t('totalEnergy')}</Text>
              <Text style={styles.detailValue}>{energyUsed.toFixed(2)} kWh</Text>
            </View>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailIcon}>📅</Text>
            <View style={styles.detailBody}>
              <Text style={styles.detailLabel}>{t('startTime')}</Text>
              <Text style={styles.detailValue}>{formatTime(startTime)}</Text>
            </View>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailIcon}>📅</Text>
            <View style={styles.detailBody}>
              <Text style={styles.detailLabel}>{t('endTime')}</Text>
              <Text style={styles.detailValue}>{formatTime(endTime)}</Text>
            </View>
          </View>
          {user?.licensePlate ? (
            <View style={[styles.detailRow, styles.detailRowLast]}>
              <Text style={styles.detailIcon}>🚗</Text>
              <View style={styles.detailBody}>
                <Text style={styles.detailLabel}>{t('licensePlate')}</Text>
                <Text style={styles.detailValue}>{user.licensePlate}</Text>
              </View>
            </View>
          ) : null}
        </View>
      </ScrollView>
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <TouchableOpacity
          style={[styles.receiptButton, downloading && styles.receiptButtonDisabled]}
          onPress={handleDownloadReceipt}
          disabled={downloading}
          activeOpacity={0.8}
        >
          {downloading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.receiptButtonText}>{t('downloadReceipt')}</Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.homeButton}
          onPress={() => navigation.navigate('QR')}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={['#06b6d4', '#2563eb']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.homeButtonGradient}
          >
            <Text style={styles.homeButtonText}>🏠 {t('backToHome')}</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  header: { paddingHorizontal: 24, paddingBottom: 8, alignItems: 'flex-end' },
  headerTitle: { paddingHorizontal: 24, paddingBottom: 12, alignItems: 'center' },
  successIconWrap: { marginBottom: 10 },
  successIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  successIconText: { fontSize: 28, color: '#22c55e' },
  title: { fontSize: 22, fontWeight: '700', color: '#fff', marginBottom: 4 },
  subtitle: { color: '#9ca3af', fontSize: 13 },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 24, paddingTop: 4, paddingBottom: 24 },
  costCard: {
    backgroundColor: 'rgba(16, 185, 129, 0.3)',
    paddingVertical: 20,
    paddingHorizontal: 24,
    borderRadius: 20,
    alignItems: 'center',
    marginBottom: 16,
  },
  costLabel: { color: 'rgba(255,255,255,0.8)', marginBottom: 4, fontSize: 13 },
  costValue: { fontSize: 32, fontWeight: '700', color: '#fff' },
  details: {
    backgroundColor: 'rgba(31, 41, 55, 0.8)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#374151',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  detailRowLast: { borderBottomWidth: 0 },
  detailIcon: { fontSize: 22, marginRight: 14 },
  detailBody: { flex: 1 },
  detailLabel: { color: '#9ca3af', fontSize: 13, marginBottom: 2 },
  detailValue: { color: '#fff', fontSize: 16, fontWeight: '700' },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(55, 65, 81, 0.6)',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  receiptButton: {
    backgroundColor: '#1f2937',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#374151',
  },
  receiptButtonDisabled: { opacity: 0.6 },
  receiptButtonText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  homeButton: {
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#06b6d4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  homeButtonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  homeButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
