# Şarj Modül – Mobil Uygulama (React Native / Expo)

EV şarj istasyonu kullanıcı uygulaması. QR ile istasyon seçimi, şarj başlat/durdur ve özet ekranları.

## Gereksinimler

- Node.js 18+
- OCPP Gateway çalışır durumda (varsayılan: `http://localhost:3000`)

## Kurulum

```bash
npm install
```

Opcional: Gateway URL için `.env` oluşturun (`.env.example` dosyasına bakın).

## Çalıştırma

```bash
npm start
```

Ardından iOS simülatör, Android emülatör veya fiziksel cihazda açın. Fiziksel cihazda test için gateway URL’ini makine IP’nize ayarlayın (örn. `EXPO_PUBLIC_OCPP_GATEWAY_URL=http://192.168.1.x:3000`).

## Akış

1. **Login** – İşlevsiz; "Giriş Yap" ile bir sonraki ekrana geçilir (auth sonradan eklenecek).
2. **QR** – "QR Kod Okut" ile istasyon listesi ekranına geçilir (kamera/okuma yok).
3. **İstasyon listesi** – `GET /charge-points` ile bağlı istasyonlar listelenir; seçip "Şarjı Başlat" ile `POST /remote-start` çağrılır.
4. **Şarj aktif** – `GET .../transactions` ile aktif transaction alınır, `GET .../meters` periyodik okunur; "Şarjı Durdur" ile onay sonrası `POST /remote-stop`, ardından özet ekranı.
5. **Özet** – Süre, enerji, tutar; "Ana Sayfaya Dön" ile QR ekranına dönülür.
