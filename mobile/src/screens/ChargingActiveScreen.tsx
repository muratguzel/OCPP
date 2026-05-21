import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Animated,
  Easing,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLanguage } from '../contexts/LanguageContext';
import { LanguageSelector } from '../components/LanguageSelector';
import { getTransactions, getMeters } from '../api/ocppGateway';
import { getChargePrice, getMyActiveTransaction } from '../api/backendApi';
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
  onChargingEnded?: (data: ChargingData, transactionId: number | string | null) => void;
}

export const ChargingActiveScreen: React.FC<ChargingActiveScreenProps> = ({
  chargePointId,
  onStopCharging,
  onChargingEnded,
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
  const [now, setNow] = useState<number>(() => Date.now());
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const endedRef = useRef<boolean>(false);

  // 1s tick for duration display; independent of 5s meter polling.
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  // Charging "alive" animations: battery fill rising + bolt flicker + shimmer line.
  const fillAnim = useRef(new Animated.Value(0)).current;
  const boltScale = useRef(new Animated.Value(1)).current;
  const boltOpacity = useRef(new Animated.Value(1)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const fill = Animated.loop(
      Animated.sequence([
        Animated.timing(fillAnim, {
          toValue: 1,
          duration: 2800,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: false,
        }),
        Animated.timing(fillAnim, {
          toValue: 0,
          duration: 400,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: false,
        }),
      ])
    );
    // Subtle scale breathing on the bolt
    const scale = Animated.loop(
      Animated.sequence([
        Animated.timing(boltScale, {
          toValue: 1.12,
          duration: 650,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(boltScale, {
          toValue: 1,
          duration: 650,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );
    // Electric flicker on the bolt — short opacity dips, asymmetric so it feels live.
    const flicker = Animated.loop(
      Animated.sequence([
        Animated.timing(boltOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.timing(boltOpacity, { toValue: 0.55, duration: 80, useNativeDriver: true }),
        Animated.timing(boltOpacity, { toValue: 1, duration: 120, useNativeDriver: true }),
        Animated.timing(boltOpacity, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(boltOpacity, { toValue: 0.7, duration: 60, useNativeDriver: true }),
        Animated.timing(boltOpacity, { toValue: 1, duration: 140, useNativeDriver: true }),
      ])
    );
    // Shimmer line sweeping across the fill top — current-flow feel
    const shimmer = Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: 1600,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    fill.start();
    scale.start();
    flicker.start();
    shimmer.start();
    return () => {
      fill.stop();
      scale.stop();
      flicker.stop();
      shimmer.stop();
    };
  }, [fillAnim, boltScale, boltOpacity, shimmerAnim]);

  const fillHeight = fillAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });
  const shimmerTranslate = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-80, 80],
  });

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

  // Resolve active transaction.
  // Önce gateway memory'sinden dene (canlı veri, in-flight meter values dahil).
  // Memory boşsa (gateway restart veya CP geçici disconnect) backend'e (DB)
  // fallback yap — orfan session'ları "No active transaction found" diye
  // yanlış göstermemek için.
  useEffect(() => {
    let cancelled = false;
    setLoadingTx(true);
    setError(null);

    (async () => {
      try {
        let active: { transactionId: number | string; startTime?: string } | null = null;
        // Eventual consistency: yeni başlatılan transaction OCPP gateway memory →
        // backend DB cascade'i için kısa grace period. İlk dene boş gelirse 1.5s
        // bekle, bir kez daha dene.
        for (let attempt = 0; attempt < 2 && !active; attempt++) {
          if (attempt > 0) {
            await new Promise((r) => setTimeout(r, 1500));
            if (cancelled) return;
          }
          try {
            const res = await getTransactions(chargePointId);
            if (cancelled) return;
            active = (res.transactions || []).find((tx) => !tx.endTime) ?? null;
          } catch {
            // Gateway 404 veya network — backend fallback'e düş
          }

          if (!active) {
            const dbTx = await getMyActiveTransaction(chargePointId).catch(() => null);
            if (cancelled) return;
            if (dbTx?.ocppTransactionId) {
              active = {
                transactionId: dbTx.ocppTransactionId,
                startTime: dbTx.startTime,
              };
            }
          }
        }

        if (cancelled) return;
        if (active) {
          setTransactionId(active.transactionId);
          if (active.startTime) setStartTime(new Date(active.startTime));
        } else {
          setError('No active transaction found');
        }
      } finally {
        if (!cancelled) setLoadingTx(false);
      }
    })();

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

  const durationSeconds = Math.floor((now - startTime.getTime()) / 1000);
  const energyKwh = meters ? parseEnergyKwh(meters) : 0;
  const powerKw = meters ? parsePowerKw(meters) : null;
  const unitPrice = pricePerKwh ?? PRICE_PER_KWH;
  const subtotal = energyKwh * unitPrice;
  const cost = subtotal * (1 + vatRate / 100);

  // Detect charger-initiated stop: when meterStop appears in polling response,
  // the session was ended by the device (cable unplug, RFID, etc.). Fire once.
  useEffect(() => {
    if (endedRef.current) return;
    if (meters?.meterStop == null) return;
    endedRef.current = true;
    onChargingEnded?.(
      {
        duration: durationSeconds,
        energyUsed: energyKwh,
        cost,
        startTime,
      },
      transactionId
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meters?.meterStop]);

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
        <View style={styles.chargingVisual}>
          <View style={styles.battery}>
            <View style={styles.batteryCap} />
            <View style={styles.batteryBody}>
              <Animated.View style={[styles.batteryFill, { height: fillHeight }]}>
                <LinearGradient
                  colors={['#34d399', '#10b981', '#059669']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 0, y: 1 }}
                  style={StyleSheet.absoluteFill}
                />
                {/* Top highlight on the fill — looks like a liquid surface */}
                <View style={styles.fillTopHighlight} />
                {/* Shimmer line sweeping horizontally — current-flow feel */}
                <Animated.View
                  style={[
                    styles.fillShimmer,
                    { transform: [{ translateX: shimmerTranslate }] },
                  ]}
                />
              </Animated.View>
              <Animated.Text
                style={[
                  styles.batteryBolt,
                  {
                    transform: [{ scale: boltScale }],
                    opacity: boltOpacity,
                  },
                ]}
              >
                ⚡
              </Animated.Text>
            </View>
          </View>
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
  chargingVisual: {
    width: 160,
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  battery: {
    width: 96,
    height: 160,
    alignItems: 'center',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 22,
    elevation: 12,
  },
  batteryCap: {
    width: 34,
    height: 10,
    borderTopLeftRadius: 5,
    borderTopRightRadius: 5,
    backgroundColor: '#e5e7eb',
    marginBottom: -2,
    zIndex: 1,
  },
  batteryBody: {
    flex: 1,
    width: '100%',
    borderRadius: 18,
    borderWidth: 3,
    borderColor: '#e5e7eb',
    backgroundColor: 'rgba(17, 24, 39, 0.85)',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  batteryFill: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    overflow: 'hidden',
  },
  fillTopHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
  },
  fillShimmer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    transform: [{ skewX: '-20deg' }],
  },
  batteryBolt: {
    fontSize: 52,
    textShadowColor: 'rgba(253, 224, 71, 0.9)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 14,
    zIndex: 2,
  },
  title: { fontSize: 24, fontWeight: '700', color: '#fff', marginBottom: 24 },
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
