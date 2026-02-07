export type Language = 'tr' | 'en' | 'de' | 'fr' | 'ar';

export const translations = {
  tr: {
    // Login Screen
    welcome: 'Hoş Geldiniz',
    loginSubtitle: 'EV Şarj İstasyonu',
    email: 'E-posta',
    password: 'Şifre',
    login: 'Giriş Yap',
    forgotPassword: 'Şifremi Unuttum?',
    
    // QR Scanner Screen
    scanQR: 'QR Kod Okut',
    scanInstruction: 'Şarj istasyonundaki QR kodu okutun',
    scanningArea: 'QR kodu kare içine hizalayın',
    manualEntry: 'Manuel Giriş',
    stationId: 'İstasyon Kimliği',
    
    // Charging Start Screen
    stationInfo: 'İstasyon Bilgileri',
    station: 'İstasyon',
    available: 'Müsait',
    power: 'Güç',
    price: 'Fiyat',
    perKwh: '/kWh',
    startCharging: 'Şarjı Başlat',
    
    // Charging Active Screen
    charging: 'Şarj Ediliyor',
    duration: 'Süre',
    energyUsed: 'Kullanılan Enerji',
    currentPower: 'Anlık Güç',
    estimatedCost: 'Tahmini Maliyet',
    stopCharging: 'Şarjı Durdur',
    
    // Charging End Screen
    confirmStop: 'Şarjı Durdurmak İstediğinize Emin misiniz?',
    confirmStopDesc: 'Şarj işlemi sonlandırılacak ve özet gösterilecek',
    cancel: 'İptal',
    confirm: 'Onayla',
    
    // Summary Screen
    chargingComplete: 'Şarj Tamamlandı',
    summary: 'Özet',
    totalDuration: 'Toplam Süre',
    totalEnergy: 'Toplam Enerji',
    finalCost: 'Toplam Tutar',
    startTime: 'Başlangıç',
    endTime: 'Bitiş',
    backToHome: 'Ana Sayfaya Dön',
    downloadReceipt: 'Fişi İndir',
    
    // Common
    back: 'Geri',
    close: 'Kapat',
    retry: 'Yeniden Dene',
    connectionErrorHint: 'Sunucuya ulaşılamıyor. OCPP Gateway çalışıyor mu? Fiziksel cihazda .env ile EXPO_PUBLIC_OCPP_GATEWAY_URL ayarlayın (örn. http://BILGISAYAR_IP:3000).',
  },
  en: {
    // Login Screen
    welcome: 'Welcome',
    loginSubtitle: 'EV Charging Station',
    email: 'Email',
    password: 'Password',
    login: 'Login',
    forgotPassword: 'Forgot Password?',
    
    // QR Scanner Screen
    scanQR: 'Scan QR Code',
    scanInstruction: 'Scan the QR code on the charging station',
    scanningArea: 'Align QR code within the frame',
    manualEntry: 'Manual Entry',
    stationId: 'Station ID',
    
    // Charging Start Screen
    stationInfo: 'Station Information',
    station: 'Station',
    available: 'Available',
    power: 'Power',
    price: 'Price',
    perKwh: '/kWh',
    startCharging: 'Start Charging',
    
    // Charging Active Screen
    charging: 'Charging',
    duration: 'Duration',
    energyUsed: 'Energy Used',
    currentPower: 'Current Power',
    estimatedCost: 'Estimated Cost',
    stopCharging: 'Stop Charging',
    
    // Charging End Screen
    confirmStop: 'Are You Sure You Want to Stop?',
    confirmStopDesc: 'Charging will be stopped and summary will be displayed',
    cancel: 'Cancel',
    confirm: 'Confirm',
    
    // Summary Screen
    chargingComplete: 'Charging Complete',
    summary: 'Summary',
    totalDuration: 'Total Duration',
    totalEnergy: 'Total Energy',
    finalCost: 'Total Cost',
    startTime: 'Start Time',
    endTime: 'End Time',
    backToHome: 'Back to Home',
    downloadReceipt: 'Download Receipt',
    
    // Common
    back: 'Back',
    close: 'Close',
    retry: 'Retry',
    connectionErrorHint: 'Cannot reach server. Is OCPP Gateway running? On a physical device, set EXPO_PUBLIC_OCPP_GATEWAY_URL in .env (e.g. http://YOUR_IP:3000).',
  },
  de: {
    // Login Screen
    welcome: 'Willkommen',
    loginSubtitle: 'EV Ladestation',
    email: 'E-Mail',
    password: 'Passwort',
    login: 'Anmelden',
    forgotPassword: 'Passwort vergessen?',
    
    // QR Scanner Screen
    scanQR: 'QR-Code scannen',
    scanInstruction: 'Scannen Sie den QR-Code an der Ladestation',
    scanningArea: 'QR-Code im Rahmen ausrichten',
    manualEntry: 'Manuelle Eingabe',
    stationId: 'Stations-ID',
    
    // Charging Start Screen
    stationInfo: 'Stationsinformationen',
    station: 'Station',
    available: 'Verfügbar',
    power: 'Leistung',
    price: 'Preis',
    perKwh: '/kWh',
    startCharging: 'Laden starten',
    
    // Charging Active Screen
    charging: 'Wird geladen',
    duration: 'Dauer',
    energyUsed: 'Verbrauchte Energie',
    currentPower: 'Aktuelle Leistung',
    estimatedCost: 'Geschätzte Kosten',
    stopCharging: 'Laden stoppen',
    
    // Charging End Screen
    confirmStop: 'Möchten Sie den Ladevorgang wirklich beenden?',
    confirmStopDesc: 'Der Ladevorgang wird beendet und die Zusammenfassung angezeigt',
    cancel: 'Abbrechen',
    confirm: 'Bestätigen',
    
    // Summary Screen
    chargingComplete: 'Laden abgeschlossen',
    summary: 'Zusammenfassung',
    totalDuration: 'Gesamtdauer',
    totalEnergy: 'Gesamtenergie',
    finalCost: 'Gesamtkosten',
    startTime: 'Startzeit',
    endTime: 'Endzeit',
    backToHome: 'Zurück zur Startseite',
    downloadReceipt: 'Beleg herunterladen',
    
    // Common
    back: 'Zurück',
    close: 'Schließen',
    retry: 'Erneut versuchen',
    connectionErrorHint: 'Server nicht erreichbar. Läuft das OCPP Gateway? Auf Gerät EXPO_PUBLIC_OCPP_GATEWAY_URL in .env setzen.',
  },
  fr: {
    // Login Screen
    welcome: 'Bienvenue',
    loginSubtitle: 'Station de recharge VE',
    email: 'E-mail',
    password: 'Mot de passe',
    login: 'Connexion',
    forgotPassword: 'Mot de passe oublié?',
    
    // QR Scanner Screen
    scanQR: 'Scanner le code QR',
    scanInstruction: 'Scannez le code QR sur la borne de recharge',
    scanningArea: 'Alignez le code QR dans le cadre',
    manualEntry: 'Saisie manuelle',
    stationId: 'ID de la station',
    
    // Charging Start Screen
    stationInfo: 'Informations sur la station',
    station: 'Station',
    available: 'Disponible',
    power: 'Puissance',
    price: 'Prix',
    perKwh: '/kWh',
    startCharging: 'Démarrer la recharge',
    
    // Charging Active Screen
    charging: 'En charge',
    duration: 'Durée',
    energyUsed: 'Énergie utilisée',
    currentPower: 'Puissance actuelle',
    estimatedCost: 'Coût estimé',
    stopCharging: 'Arrêter la recharge',
    
    // Charging End Screen
    confirmStop: 'Êtes-vous sûr de vouloir arrêter?',
    confirmStopDesc: 'La recharge sera arrêtée et le résumé sera affiché',
    cancel: 'Annuler',
    confirm: 'Confirmer',
    
    // Summary Screen
    chargingComplete: 'Recharge terminée',
    summary: 'Résumé',
    totalDuration: 'Durée totale',
    totalEnergy: 'Énergie totale',
    finalCost: 'Coût total',
    startTime: 'Heure de début',
    endTime: 'Heure de fin',
    backToHome: "Retour à l'accueil",
    downloadReceipt: 'Télécharger le reçu',
    
    // Common
    back: 'Retour',
    close: 'Fermer',
    retry: 'Réessayer',
    connectionErrorHint: 'Serveur inaccessible. Le gateway OCPP est-il démarré? Sur appareil, définir EXPO_PUBLIC_OCPP_GATEWAY_URL dans .env.',
  },
  ar: {
    // Login Screen
    welcome: 'مرحباً',
    loginSubtitle: 'محطة شحن السيارات الكهربائية',
    email: 'البريد الإلكتروني',
    password: 'كلمة المرور',
    login: 'تسجيل الدخول',
    forgotPassword: 'نسيت كلمة المرور؟',
    
    // QR Scanner Screen
    scanQR: 'مسح رمز الاستجابة السريعة',
    scanInstruction: 'امسح رمز الاستجابة السريعة على محطة الشحن',
    scanningArea: 'قم بمحاذاة رمز الاستجابة السريعة داخل الإطار',
    manualEntry: 'إدخال يدوي',
    stationId: 'معرف المحطة',
    
    // Charging Start Screen
    stationInfo: 'معلومات المحطة',
    station: 'المحطة',
    available: 'متاح',
    power: 'الطاقة',
    price: 'السعر',
    perKwh: '/كيلووات ساعة',
    startCharging: 'بدء الشحن',
    
    // Charging Active Screen
    charging: 'جاري الشحن',
    duration: 'المدة',
    energyUsed: 'الطاقة المستخدمة',
    currentPower: 'الطاقة الحالية',
    estimatedCost: 'التكلفة المقدرة',
    stopCharging: 'إيقاف الشحن',
    
    // Charging End Screen
    confirmStop: 'هل أنت متأكد أنك تريد التوقف؟',
    confirmStopDesc: 'سيتم إيقاف الشحن وعرض الملخص',
    cancel: 'إلغاء',
    confirm: 'تأكيد',
    
    // Summary Screen
    chargingComplete: 'اكتمل الشحن',
    summary: 'الملخص',
    totalDuration: 'المدة الإجمالية',
    totalEnergy: 'الطاقة الإجمالية',
    finalCost: 'التكلفة الإجمالية',
    startTime: 'وقت البدء',
    endTime: 'وقت الانتهاء',
    backToHome: 'العودة إلى الصفحة الرئيسية',
    downloadReceipt: 'تحميل الإيصال',
    
    // Common
    back: 'رجوع',
    close: 'إغلاق',
    retry: 'إعادة المحاولة',
    connectionErrorHint: 'لا يمكن الوصول إلى الخادم. هل بوابة OCPP تعمل؟ على الجهاز قم بتعيين EXPO_PUBLIC_OCPP_GATEWAY_URL في .env.',
  },
};

export const languageNames = {
  tr: 'Türkçe',
  en: 'English',
  de: 'Deutsch',
  fr: 'Français',
  ar: 'العربية',
};
