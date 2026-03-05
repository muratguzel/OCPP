import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import type { RootStackParamList } from '../types/navigation';

type Nav = NativeStackNavigationProp<RootStackParamList, 'PrivacyPolicy'>;

export const PrivacyPolicyScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();

  return (
    <LinearGradient colors={['#000000', '#111827', '#1f2937']} style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <Text style={styles.title}>Gizlilik Politikası</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>✕</Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <Text style={styles.text}>Son güncelleme: 05.03.2026</Text>

        <Text style={styles.text}>Bu Gizlilik Politikası, Egebilgi Yazılım San. Ltd. Şti. ("Egebilgi Yazılım San. Ltd. Şti." veya "Şirket") tarafından geliştirilen ve işletilen Şarj Modul mobil uygulaması ("Uygulama") aracılığıyla elde edilen kişisel verilerin korunmasına ilişkin esasları açıklamaktadır. Uygulama, App Store (iOS) ve Google Play (Android) platformlarında kullanıma sunulmaktadır.</Text>

        <Text style={styles.heading}>1. Kapsam</Text>
        <Text style={styles.text}>Bu politika, Uygulamayı indiren, kuran veya kullanan tüm gerçek kişiler için geçerlidir.</Text>

        <Text style={styles.heading}>2. Toplanan Kişisel Veriler</Text>
        <Text style={styles.text}>Uygulamamız aracılığıyla aşağıdaki kategorilerde kişisel veriler toplanabilir:
- Kimlik Bilgileri: Ad, soyad ve benzeri tanımlayıcı bilgiler
- İletişim Bilgileri: E-posta adresi, telefon numarası
- Konum Verisi: Uygulamanın temel işlevselliği kapsamında, yakınızdaki şarj istasyonlarını göstermek amacıyla anlık veya sürekli konum verisi
- Kullanım Verileri: Uygulama içi işlem kayıtları, oturum bilgileri, cihaz türü, işletim sistemi sürümü ve uygulama kullanım istatistikleri
- Çerez ve Analitik Veriler: Kullanıcı deneyimini iyileştirmeye yönelik analitik veriler</Text>

        <Text style={styles.heading}>3. Konum Verisinin Kullanımı</Text>
        <Text style={styles.text}>Uygulamamız, kullanıcının rızasına dayalı olarak konum verisine erişebilmektedir. Konum verisi yalnızca şu amaçlarla kullanılır:
- Yakındaki şarj istasyonlarının listelenmesi ve harita üzerinde gösterilmesi
- En yakın istasyona yol tarifi sağlanması
- Kullanıcıya özelleştirilmiş hizmet sunulması
Konum veriniz üçüncü taraflarla izniniz olmaksızın paylaşılmaz. Konum erişimini istediğiniz zaman cihaz ayarlarından kapatabilirsiniz; ancak bu durumda uygulamanın bazı özellikleri çalışmayabilir.</Text>

        <Text style={styles.heading}>... ve Politikanın Devamı</Text>
        <Text style={styles.text}>Tam Gizlilik Politikası metnine ulaşmak için lütfen aşağıdaki web adresini ziyaret edin:</Text>
        
        <Text style={styles.link}>https://app.sarjmodul.com/privacy-policy</Text>

        <Text style={styles.text}>Egebilgi Yazılım San. Ltd. Şti. bu Gizlilik Politikası'nı dilediği zaman güncelleme hakkını saklı tutar.</Text>
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  title: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  backBtn: { padding: 8, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 20 },
  backBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  content: { flex: 1 },
  contentContainer: { padding: 24, paddingBottom: 60 },
  heading: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginTop: 20, marginBottom: 8 },
  text: { color: '#d1d5db', fontSize: 14, lineHeight: 22, marginBottom: 16 },
  link: { color: '#3b82f6', fontSize: 16, marginTop: 16, marginBottom: 32, fontWeight: 'bold' }
});
