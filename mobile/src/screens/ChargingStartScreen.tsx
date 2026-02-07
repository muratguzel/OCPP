import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { useLanguage } from '../contexts/LanguageContext';
import { LanguageSelector } from '../components/LanguageSelector';
import { getChargePoints, remoteStart, type ChargePoint } from '../api/ocppGateway';
import { OCPP_GATEWAY_URL } from '../constants/config';
import type { RootStackParamList } from '../types/navigation';

type Nav = NativeStackNavigationProp<RootStackParamList, 'ChargingStart'>;

export const ChargingStartScreen: React.FC = () => {
  const { t } = useLanguage();
  const navigation = useNavigation<Nav>();
  const [chargePoints, setChargePoints] = useState<ChargePoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchChargePoints = () => {
    setLoading(true);
    setError(null);
    getChargePoints()
      .then((res) => {
        setChargePoints(res.chargePoints || []);
        if (res.chargePoints?.length) {
          setSelectedId(res.chargePoints[0].chargePointId);
        }
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : String(err));
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchChargePoints();
  }, []);

  const handleStartCharging = async () => {
    if (!selectedId) return;
    setStarting(true);
    setError(null);
    try {
      const res = await remoteStart({ chargePointId: selectedId });
      if (res.success) {
        navigation.navigate('ChargingActive', { chargePointId: selectedId });
      } else {
        Alert.alert(t('stationInfo'), res.status || 'Start failed');
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      Alert.alert(t('stationInfo'), msg);
    } finally {
      setStarting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#22d3ee" />
        <Text style={styles.loadingText}>{t('stationInfo')}</Text>
      </View>
    );
  }

  return (
    <LinearGradient
      colors={['#000000', '#111827', '#1f2937']}
      style={styles.gradient}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <LanguageSelector />
      </View>
      <View style={styles.headerTitle}>
        <Text style={styles.title}>{t('stationInfo')}</Text>
        {error && !loading && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
            <Text style={styles.urlText}>URL: {OCPP_GATEWAY_URL}</Text>
            <Text style={styles.errorHint}>{t('connectionErrorHint')}</Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={fetchChargePoints}
              activeOpacity={0.8}
            >
              <Text style={styles.retryButtonText}>{t('retry')}</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {chargePoints.length === 0 && !error ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>No stations connected</Text>
          </View>
        ) : chargePoints.length > 0 ? (
          chargePoints.map((cp) => (
            <TouchableOpacity
              key={cp.chargePointId}
              style={[
                styles.card,
                selectedId === cp.chargePointId && styles.cardSelected,
              ]}
              onPress={() => setSelectedId(cp.chargePointId)}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#06b6d4', '#2563eb']}
                style={styles.cardImage}
              >
                <Text style={styles.cardImageIcon}>⚡</Text>
              </LinearGradient>
              <View style={styles.cardBody}>
                <Text style={styles.cardTitle}>{cp.chargePointId}</Text>
                <Text style={styles.cardMeta}>
                  {cp.protocol} • {cp.connectorCount} connector(s)
                </Text>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{t('available')}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>{t('power')}</Text>
                  <Text style={styles.infoValue}>—</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>{t('price')}</Text>
                  <Text style={styles.infoValue}>— {t('perKwh')}</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))
        ) : null}
      </ScrollView>
      {chargePoints.length > 0 && selectedId && (
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.startButton}
            onPress={handleStartCharging}
            disabled={starting}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={['#10b981', '#059669']}
              style={styles.startButtonGradient}
            >
              {starting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Text style={styles.startButtonIcon}>⚡</Text>
                  <Text style={styles.startButtonText}>{t('startCharging')}</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    paddingBottom: 8,
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
  headerTitle: { paddingHorizontal: 24, paddingBottom: 16 },
  title: { fontSize: 22, fontWeight: '700', color: '#fff' },
  errorBox: {
    marginTop: 12,
    padding: 16,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.4)',
  },
  errorText: { color: '#fca5a5', fontSize: 14, marginBottom: 4 },
  urlText: { color: '#94a3b8', fontSize: 11, marginBottom: 8, fontFamily: 'monospace' },
  errorHint: { color: '#9ca3af', fontSize: 12, marginBottom: 12 },
  retryButton: {
    alignSelf: 'flex-start',
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#374151',
    borderRadius: 10,
  },
  retryButtonText: { color: '#fff', fontWeight: '600' },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 24, paddingBottom: 24 },
  emptyBox: {
    padding: 24,
    backgroundColor: 'rgba(31, 41, 55, 0.8)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#374151',
  },
  emptyText: { color: '#9ca3af', textAlign: 'center' },
  card: {
    backgroundColor: '#1f2937',
    borderRadius: 24,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  cardSelected: { borderColor: '#22d3ee' },
  cardImage: {
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardImageIcon: { fontSize: 48 },
  cardBody: { padding: 20 },
  cardTitle: { fontSize: 20, fontWeight: '700', color: '#fff', marginBottom: 4 },
  cardMeta: { color: '#9ca3af', fontSize: 14, marginBottom: 8 },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 12,
  },
  badgeText: { color: '#22c55e', fontWeight: '600', fontSize: 14 },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  infoLabel: { color: '#9ca3af', fontSize: 14 },
  infoValue: { color: '#fff', fontSize: 16, fontWeight: '600' },
  footer: { padding: 24, paddingTop: 16 },
  startButton: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  startButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    gap: 8,
  },
  startButtonIcon: { fontSize: 22 },
  startButtonText: { color: '#fff', fontSize: 18, fontWeight: '700' },
});
