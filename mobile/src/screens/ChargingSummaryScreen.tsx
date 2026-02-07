import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { useLanguage } from '../contexts/LanguageContext';
import { LanguageSelector } from '../components/LanguageSelector';
import type { RootStackParamList } from '../types/navigation';
import type { ChargingData } from './ChargingActiveScreen';

type Nav = NativeStackNavigationProp<RootStackParamList, 'ChargingSummary'>;
type Route = RouteProp<RootStackParamList, 'ChargingSummary'>;

export const ChargingSummaryScreen: React.FC = () => {
  const { t, isRTL } = useLanguage();
  const route = useRoute<Route>();
  const navigation = useNavigation<Nav>();
  const chargingData = route.params?.chargingData;
  if (!chargingData) return null;
  const { duration, energyUsed, cost, startTime } = chargingData;
  const endTime = new Date(startTime.getTime() + duration * 1000);

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
      <View style={styles.header}>
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
        </View>
        <TouchableOpacity
          style={styles.receiptButton}
          onPress={() => {}}
          activeOpacity={0.8}
        >
          <Text style={styles.receiptButtonText}>{t('downloadReceipt')}</Text>
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
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  header: { padding: 24, alignItems: 'flex-end' },
  headerTitle: { paddingHorizontal: 24, paddingBottom: 24, alignItems: 'center' },
  successIconWrap: { marginBottom: 16 },
  successIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  successIconText: { fontSize: 36, color: '#22c55e' },
  title: { fontSize: 28, fontWeight: '700', color: '#fff', marginBottom: 8 },
  subtitle: { color: '#9ca3af' },
  scroll: { flex: 1 },
  scrollContent: { padding: 24, paddingBottom: 48 },
  costCard: {
    backgroundColor: 'rgba(16, 185, 129, 0.3)',
    padding: 32,
    borderRadius: 24,
    alignItems: 'center',
    marginBottom: 24,
  },
  costLabel: { color: 'rgba(255,255,255,0.8)', marginBottom: 8 },
  costValue: { fontSize: 40, fontWeight: '700', color: '#fff' },
  details: {
    backgroundColor: 'rgba(31, 41, 55, 0.8)',
    borderRadius: 24,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#374151',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  detailIcon: { fontSize: 24, marginRight: 16 },
  detailBody: { flex: 1 },
  detailLabel: { color: '#9ca3af', fontSize: 14, marginBottom: 4 },
  detailValue: { color: '#fff', fontSize: 18, fontWeight: '700' },
  receiptButton: {
    backgroundColor: '#1f2937',
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#374151',
  },
  receiptButtonText: { color: '#fff', fontSize: 18, fontWeight: '600' },
  homeButton: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#06b6d4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  homeButtonGradient: {
    paddingVertical: 18,
    alignItems: 'center',
  },
  homeButtonText: { color: '#fff', fontSize: 18, fontWeight: '700' },
});
