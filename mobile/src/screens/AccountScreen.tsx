import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { LanguageSelector } from '../components/LanguageSelector';

export const AccountScreen: React.FC = () => {
  const { t } = useLanguage();
  const { user, logout } = useAuth();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const roleLabel = (() => {
    switch (user?.role) {
      case 'super_admin': return 'Super Admin';
      case 'admin': return 'Admin';
      default: return t('profile');
    }
  })();

  return (
    <LinearGradient colors={['#000000', '#111827', '#1f2937']} style={styles.gradient}>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <LanguageSelector />
      </View>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.avatarWrap}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {(user?.name ?? '?').trim().charAt(0).toUpperCase()}
            </Text>
          </View>
        </View>
        <Text style={styles.title}>{user?.name ?? '—'}</Text>
        <Text style={styles.subtitle}>{user?.email ?? ''}</Text>

        <View style={styles.card}>
          <Row label={t('name')} value={user?.name ?? '—'} />
          <Row label={t('email')} value={user?.email ?? '—'} />
          {user?.phone ? <Row label="Telefon" value={user.phone} /> : null}
          <Row label={t('licensePlate')} value={user?.licensePlate ?? t('notSet')} highlight={!!user?.licensePlate} />
          <Row label={t('role')} value={roleLabel} last />
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={() => logout()} activeOpacity={0.85}>
          <Text style={styles.logoutText}>{t('logout')}</Text>
        </TouchableOpacity>
      </ScrollView>
    </LinearGradient>
  );
};

interface RowProps {
  label: string;
  value: string;
  highlight?: boolean;
  last?: boolean;
}

const Row: React.FC<RowProps> = ({ label, value, highlight, last }) => (
  <View style={[styles.row, last && styles.rowLast]}>
    <Text style={styles.rowLabel}>{label}</Text>
    <Text style={[styles.rowValue, highlight && styles.rowValueHighlight]} numberOfLines={1}>
      {value}
    </Text>
  </View>
);

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
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
  content: {
    flexGrow: 1,
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 48,
  },
  avatarWrap: { marginTop: 8, marginBottom: 16 },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(6, 182, 212, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(34, 211, 238, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: { fontSize: 40, color: '#22d3ee', fontWeight: '700' },
  title: { fontSize: 24, fontWeight: '700', color: '#fff' },
  subtitle: { color: '#9ca3af', marginTop: 4, marginBottom: 24 },
  card: {
    width: '100%',
    backgroundColor: 'rgba(31, 41, 55, 0.8)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#374151',
    paddingHorizontal: 20,
    paddingVertical: 8,
    marginBottom: 24,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
    gap: 12,
  },
  rowLast: { borderBottomWidth: 0 },
  rowLabel: { color: '#9ca3af', fontSize: 14 },
  rowValue: { color: '#fff', fontSize: 16, fontWeight: '600', flexShrink: 1, textAlign: 'right' },
  rowValueHighlight: { color: '#22d3ee' },
  logoutButton: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.4)',
    alignItems: 'center',
  },
  logoutText: { color: '#f87171', fontSize: 16, fontWeight: '600' },
});
