import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLanguage } from '../contexts/LanguageContext';
import { LanguageSelector } from '../components/LanguageSelector';
import { getTransactions, getMeters } from '../api/ocppGateway';
import { getChargePrice } from '../api/backendApi';
import { parseEnergyKwh, parsePowerKw } from '../utils/meterParser';
import { PRICE_PER_KWH } from '../constants/config';
import type { MetersResponse } from '../api/ocppGateway';
import { ScrollView } from 'react-native-gesture-handler';

export interface ChargingData {
  duration: number;
  energyUsed: number;
  cost: number;
  startTime: Date;
}

const POLL_INTERVAL_MS = 5000;

interface ChargingActiveScreenProps {
  chargePointId: string;
  onStopCharging: (data: ChargingData, transactionId: number | string) => void;
}

export const ChargingActiveScreen: React.FC<ChargingActiveScreenProps> = ({
  chargePointId,
  onStopCharging,
}) => {
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  const [transactionId, setTransactionId] = useState<number | string | null>(null);
  const [startTime, setStartTime] = useState<Date>(() => new Date());
  const [meters, setMeters] = useState<MetersResponse | null>(null);
  const [loadingTx, setLoadingTx] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pricePerKwh, setPricePerKwh] = useState<number | null>(null);
  const [vatRate, setVatRate] = useState<number>(0);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Fetch tenant price for this charge point (for accurate cost display)
  useEffect(() => {
    let cancelled = false;
    getChargePrice(chargePointId)
      .then((p) => {
        if (!cancelled) {
          setPricePerKwh(p.pricePerKwh);
          setVatRate(p.vatRate ?? 0);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setPricePerKwh(null);
          setVatRate(0);
        }
      });
    return () => { cancelled = true; };
  }, [chargePointId]);

  // Resolve active transaction
  useEffect(() => {
    let cancelled = false;
    setLoadingTx(true);
    getTransactions(chargePointId)
      .then((res) => {
        if (cancelled) return;
        const active = (res.transactions || []).find((tx) => !tx.endTime);
        if (active) {
          setTransactionId(active.transactionId);
          if (active.startTime) setStartTime(new Date(active.startTime));
        } else {
          setError('No active transaction found');
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : String(err));
      })
      .finally(() => {
        if (!cancelled) setLoadingTx(false);
      });
    return () => { cancelled = true; };
  }, [chargePointId]);

  // Poll meters when we have transactionId
  useEffect(() => {
    if (transactionId == null) return;
    const poll = () => {
      getMeters(chargePointId, transactionId)
        .then(setMeters)
        .catch(() => {});
    };
    poll();
    pollRef.current = setInterval(poll, POLL_INTERVAL_MS);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      pollRef.current = null;
    };
  }, [chargePointId, transactionId]);

  const durationSeconds = Math.floor(
    (Date.now() - startTime.getTime()) / 1000
  );
  const energyKwh = meters ? parseEnergyKwh(meters) : 0;
  const powerKw = meters ? parsePowerKw(meters) : null;
  const unitPrice = pricePerKwh ?? PRICE_PER_KWH;
  const subtotal = energyKwh * unitPrice;
  const cost = subtotal * (1 + vatRate / 100);

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const handleStop = () => {
    if (transactionId != null) {
      onStopCharging(
        {
          duration: durationSeconds,
          energyUsed: energyKwh,
          cost,
          startTime,
        },
        transactionId
      );
    }
  };

  if (loadingTx) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#22d3ee" />
        <Text style={styles.loadingText}>{t('charging')}</Text>
      </View>
    );
  }

  if (error && !transactionId) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => setLoadingTx(true)}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <LinearGradient
      colors={['#000000', '#111827', '#000000']}
      style={styles.gradient}
    >
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <LanguageSelector />
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.iconCircle}>
          <Text style={styles.iconText}>⚡</Text>
        </View>
        <Text style={styles.title}>{t('charging')}</Text>
        <View style={styles.metrics}>
          <View style={styles.metricCard}>
            <Text style={styles.metricIcon}>🕐</Text>
            <Text style={styles.metricLabel}>{t('duration')}</Text>
            <Text style={styles.metricValue}>{formatDuration(durationSeconds)}</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricIcon}>🔋</Text>
            <Text style={styles.metricLabel}>{t('energyUsed')}</Text>
            <Text style={styles.metricValue}>{energyKwh.toFixed(2)} kWh</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricIcon}>📈</Text>
            <Text style={styles.metricLabel}>{t('currentPower')}</Text>
            <Text style={styles.metricValue}>
              {powerKw != null ? `${powerKw.toFixed(1)} kW` : '—'}
            </Text>
          </View>
          <View style={[styles.metricCard, styles.costCard]}>
            <View style={styles.costCardContent}>
              <View style={styles.costRow}>
                <Text style={styles.metricIcon}>💰</Text>
                <Text style={styles.metricLabelCost}>{t('estimatedCost')}</Text>
                <Text style={styles.metricValue}>₺{cost.toFixed(2)}</Text>
              </View>
              <Text style={styles.costFormula} numberOfLines={2}>
                {energyKwh.toFixed(2)} kWh × ₺{unitPrice.toFixed(2)}/kWh
                {vatRate > 0 ? ` (${t('vatIncluded')} %${vatRate})` : ''}
              </Text>
            </View>
          </View>
        </View>
        <TouchableOpacity
          style={styles.stopButton}
          onPress={handleStop}
          disabled={transactionId == null}
          activeOpacity={0.9}
        >
          <Text style={styles.stopButtonText}>{t('stopCharging')}</Text>
        </TouchableOpacity>
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  loadingText: { color: '#9ca3af', marginTop: 16 },
  errorText: { color: '#ef4444', textAlign: 'center', marginBottom: 16 },
  retryButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: '#374151',
    borderRadius: 12,
  },
  retryText: { color: '#fff' },
  header: { paddingHorizontal: 24, paddingBottom: 24, alignItems: 'flex-end' },
  content: {
    flexGrow: 1,
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingBottom: 48,
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(16, 185, 129, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  iconText: { fontSize: 56 },
  title: { fontSize: 28, fontWeight: '700', color: '#fff', marginBottom: 32 },
  metrics: { width: '100%', maxWidth: 360, marginBottom: 32
    
   },
  metricCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(31, 41, 55, 0.6)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#374151',
  },
  metricIcon: { fontSize: 24, marginRight: 12 },
  metricLabel: { flex: 1, color: '#9ca3af', fontSize: 14 },
  metricValue: { color: '#fff', fontSize: 22, fontWeight: '700' },
  costCard: {
    backgroundColor: 'rgba(6, 182, 212, 0.1)',
    borderColor: 'rgba(34, 211, 238, 0.3)',
  },
  costCardContent: { flex: 1 },
  costRow: { flexDirection: 'row', alignItems: 'center' },
  costFormula: {
    marginTop: 8,
    fontSize: 12,
    color: 'rgba(34, 211, 238, 0.85)',
  },
  metricLabelCost: { flex: 1, color: '#22d3ee', fontSize: 14 },
  stopButton: {
    width: '100%',
    maxWidth: 360,
    paddingVertical: 20,
    borderRadius: 16,
    backgroundColor: '#dc2626',
    alignItems: 'center',
    shadowColor: '#dc2626',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  stopButtonText: { color: '#fff', fontSize: 18, fontWeight: '700' },
});
