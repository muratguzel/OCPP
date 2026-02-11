import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLanguage } from '../contexts/LanguageContext';
import { LanguageSelector } from '../components/LanguageSelector';
import { getTransactions, type Transaction } from '../api/backendApi';

export const UsageScreen: React.FC = () => {
  const { t } = useLanguage();
  const navigation = useNavigation();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    getTransactions()
      .then(setTransactions)
      .catch(() => setTransactions([]))
      .finally(() => setIsLoading(false));
  }, []);

  const totalKwh = transactions.reduce((sum, tx) => {
    const k = parseFloat(tx.kwh ?? '0');
    return sum + (Number.isNaN(k) ? 0 : k);
  }, 0);

  const totalCost = transactions.reduce((sum, tx) => {
    const c = parseFloat(tx.cost ?? '0');
    return sum + (Number.isNaN(c) ? 0 : c);
  }, 0);

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <LinearGradient
      colors={['#000000', '#111827', '#1f2937']}
      style={styles.gradient}
    >
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <LanguageSelector />
      </View>
      <View style={styles.content}>
        <Text style={styles.title}>{t('usage') || 'My Usage'}</Text>
        <Text style={styles.subtitle}>
          {t('usageSubtitle') || 'Your charging history and total consumption'}
        </Text>

        {isLoading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color="#22d3ee" />
            <Text style={styles.loadingText}>Loading...</Text>
          </View>
        ) : (
          <>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>{t('totalEnergy') || 'Total Energy'}</Text>
              <Text style={styles.summaryValue}>{totalKwh.toFixed(2)} kWh</Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>{t('totalCost') || 'Total Cost'}</Text>
              <Text style={styles.summaryValue}>₺{totalCost.toFixed(2)}</Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>{t('sessions') || 'Sessions'}</Text>
              <Text style={styles.summaryValue}>{transactions.length}</Text>
            </View>

            <Text style={styles.sectionTitle}>{t('history') || 'History'}</Text>
            <ScrollView
              style={styles.list}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
            >
              {transactions.length === 0 ? (
                <Text style={styles.emptyText}>
                  {t('noUsageYet') || 'No charging sessions yet.'}
                </Text>
              ) : (
                transactions.map((tx: Transaction) => (
                  <View key={tx.id} style={styles.row}>
                    <View style={styles.rowLeft}>
                      <Text style={styles.rowStation}>{tx.chargePointId}</Text>
                      <Text style={styles.rowDate}>{formatDate(tx.startTime)}</Text>
                    </View>
                    <View style={styles.rowRight}>
                      <Text style={styles.rowKwh}>{tx.kwh ?? '—'} kWh</Text>
                      <Text style={styles.rowCost}>
                        {tx.cost != null ? `₺${tx.cost}` : '—'}
                      </Text>
                    </View>
                  </View>
                ))
              )}
            </ScrollView>
          </>
        )}
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  header: {
    paddingHorizontal: 24,
    paddingBottom: 24,
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
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    color: '#9ca3af',
    marginBottom: 24,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 48,
  },
  loadingText: { color: '#9ca3af', marginTop: 16 },
  summaryCard: {
    backgroundColor: 'rgba(31, 41, 55, 0.9)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#374151',
  },
  summaryLabel: {
    color: '#9ca3af',
    fontSize: 14,
    marginBottom: 4,
  },
  summaryValue: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '700',
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 24,
    marginBottom: 12,
  },
  list: { flex: 1 },
  listContent: { paddingBottom: 48 },
  emptyText: {
    color: '#9ca3af',
    textAlign: 'center',
    paddingVertical: 24,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(31, 41, 55, 0.6)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#374151',
  },
  rowLeft: { flex: 1 },
  rowRight: { alignItems: 'flex-end' },
  rowStation: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  rowDate: {
    color: '#9ca3af',
    fontSize: 12,
  },
  rowKwh: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  rowCost: {
    color: '#22c55e',
    fontSize: 14,
    fontWeight: '700',
  },
});
