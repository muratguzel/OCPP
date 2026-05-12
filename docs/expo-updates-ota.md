# Expo Updates (OTA) — Kurulum ve Kullanım Rehberi

Bu doküman `mobile/` projesinde **Expo Updates (Over-The-Air)** mekanizmasını anlatır:
mağaza review'una girmeden JS/asset değişikliklerini canlı kullanıcıya nasıl iletiriz?

> Önemli: OTA mekanizmasının çalışabilmesi için mağazadaki binary'nin
> `expo-updates` ile derlenmiş olması şarttır. Bu sebeple **tek seferlik**
> bir store submission'a daha ihtiyaç var (sürüm 1.1.1). Sonraki JS-only
> değişiklikler için review beklemeyeceğiz.

---

## 1. Mental model — neyi OTA'layabiliriz?

React Native uygulaması iki dünyada çalışır:

| Dünya | İçerik | OTA olur mu? |
|---|---|---|
| **JS dünyası** | senin React/TS kodun, saf JS kütüphaneleri, asset'ler | ✅ Evet |
| **Native dünya** | iOS Swift/Obj-C, Android Kotlin/Java, native modüller | ❌ Hayır — store build gerekir |

`eas update` komutu **JS bundle + asset'leri** Expo CDN'e yükler.
Telefondaki binary, açılışta uyumlu bir bundle var mı diye bakar, varsa indirir,
**bir sonraki açılışta** yeni JS çalışır. Native kod aynı kalır.

### OTA olur ✅
- JS / TS kod değişikliği (ekran, mantık, API çağrısı, parse)
- Asset (PNG, font, JSON)
- Saf JS kütüphanesi ekleme (`lodash`, `date-fns`, `zod`, `axios`, `dayjs`...)
- Yazı / dil değişiklikleri

### OTA olmaz ❌ (yeni build + store submission gerekir)
- Native modüllü kütüphane (`expo-camera`, `expo-notifications`, `react-native-reanimated`, vb.)
- SDK yükseltme (54 → 55)
- Yeni izin (`Info.plist` / `AndroidManifest`)
- `app.json`'da native alanlar (icon, splash, bundleId, scheme, plugins)
- `runtimeVersion`'ı etkileyen herhangi bir değişiklik

> Tanıma kuralı: `node_modules/<lib>/` içinde `ios/` veya `android/` klasörü
> varsa native'dir → OTA olmaz.

---

## 2. Tek seferlik kurulum (1.1.1 ile yapılır)

Aşağıdaki adımlar **yalnız bir kez** uygulanır. Sonrasında günlük döngü
çok kısa olacak.

### 2.1. `expo-updates` paketi kur
```bash
cd mobile
npx expo install expo-updates
```

### 2.2. `app.json` düzenle
EAS Update aktif olabilmesi için iki alan gerekir:

```jsonc
{
  "expo": {
    "runtimeVersion": { "policy": "fingerprint" },
    "updates": {
      "url": "https://u.expo.dev/<projectId>"
    }
  }
}
```

- `runtimeVersion`:
  - `"fingerprint"` policy → native config'in hash'i. Yeni native lib
    eklenirse hash değişir, EAS yanlış OTA push'unu otomatik reddeder.
    **Önerilen** — kazaen native değişiklikli OTA push'lamayı engeller.
  - `"appVersion"` alternatifi: `version` alanına bağlıdır; daha basit
    ama yanlışlıkla native lib eklersen koruma yoktur.
- `updates.url`: `eas update:configure` çalıştırıldığında otomatik yazılır.

### 2.3. `eas.json` düzenle
`production` profiline kanal ekle:

```jsonc
{
  "build": {
    "production": {
      "channel": "production",
      "android": { ... },
      "ios":     { ... }
    }
  }
}
```

`channel` alanı, binary'nin hangi update branch'ini dinleyeceğini söyler.

### 2.4. EAS tarafını kur
```bash
cd mobile
eas update:configure
```
Bu komut:
- Expo CDN üzerinde proje için update endpoint'i oluşturur
- `app.json`'a `updates.url` yazar
- Gerekirse `runtimeVersion` ekler (sen önceden `fingerprint` yazdıysan değiştirmez)

### 2.5. Versiyonu artır
```jsonc
// app.json
"version": "1.1.1"
```
`eas.json`'da `appVersionSource: "remote"` + `autoIncrement: true` olduğu
için iOS `buildNumber` ve Android `versionCode` EAS tarafından otomatik
artırılır — manuel müdahale gerekmez.

### 2.6. Build + submit (son kez bu boyutta)
```bash
eas build --platform all --profile production
eas submit --platform all --profile production
```
Apple review: 1-2 gün. Google review: birkaç saat – 1 gün.

> Bu submission onaylandıktan sonra kullanıcının telefonunda 1.1.1 binary
> çalışmaya başlar — **artık OTA dinlemeye hazır**.

---

## 3. Günlük kullanım — OTA döngüsü

1.1.1 mağazalarda yayında olduktan sonra:

```bash
# 1. JS / asset değişikliğini yap
# 2. mobile dizinine geç
cd mobile

# 3. (opsiyonel) önce staging branch'e gönder, dahili test et
eas update --branch staging --message "stop endpoint fix dahili test"

# 4. production'a yayınla
eas update --branch production --message "stopCharge backend endpoint'e taşındı"
```

Süreç:
- `eas update` JS bundle'ı build edip CDN'e yükler (~30-60 sn)
- Kullanıcı uygulamayı açtığında arka planda yeni bundle iner
- **Bir sonraki açılışta** yeni JS çalışır
- App Store / Play Console'da **hiçbir şey değişmez**, review yok
- Sürüm hâlâ `1.1.1` görünür

---

## 4. Rollback — bozuk OTA push'lamak

Hatalı bir update gönderirsen:

```bash
# son birkaç update'i listele
eas update:list --branch production

# bir önceki update grubuna geri dön
eas update:republish --group <group-id> --branch production
```

Dakikalar içinde tüm kullanıcı eski versiyona döner. Yine review yok.

---

## 5. Sık komutlar

```bash
# Update yayınla
eas update --branch production --message "..."

# Update geçmişi
eas update:list --branch production

# Detay
eas update:view <update-id>

# Geri al
eas update:republish --group <group-id> --branch production

# Kanalları gör
eas channel:list

# Hangi kanal hangi branch'e bağlı?
eas channel:view production

# Branch oluştur (ör. staging)
eas branch:create staging
eas channel:create staging --branch staging
```

---

## 6. Versiyon mantığı — kafa karıştırıcı kısım

| Alan | Ne işe yarar | Ne zaman değişir |
|---|---|---|
| `version` (app.json) | Store'da görünen sürüm | Yeni store build'de |
| `runtimeVersion` | JS bundle ↔ binary uyum kontrolü | Native değişikliğinde (fingerprint otomatik) |
| `ios.buildNumber` | iOS submission sayacı | Her build (EAS otomatik) |
| `android.versionCode` | Android submission sayacı | Her build (EAS otomatik) |

Kural: **OTA için `version`'a dokunma.** `eas update` push'larken sürüm
artırırsan fingerprint kırılır (appVersion policy'sinde) veya kullanıcılar
zaten yeni sürümü bekler, OTA'nın anlamı kalmaz.

---

## 7. Tipik tuzaklar

- **Backend uyumsuzluğu**: Mobile yeni `/charge/stop` endpoint'ini çağırıyor
  ama backend henüz deploy edilmemiş → 404 alır. OTA push'lamadan önce
  backend hazır olduğundan emin ol.
- **Asset boyutu**: Çok büyük resim/font OTA bundle'ı şişirir, mobil data
  kullananları üzer. Bundle boyutunu izle: `eas update:view`.
- **Telefon hemen güncellemez**: Kullanıcının uygulamayı açıp **kapatıp
  tekrar açması** gerekir. İlk açılışta indirir, ikinci açılışta çalıştırır.
  Anlık dağıtım değil.
- **Yanlışlıkla native lib eklemek**: `fingerprint` policy bunu yakalar;
  `appVersion` policy yakalamaz — crash'e sebep olabilir.
- **Test etmeden production'a basma**: Önce `--branch staging`'e gönder,
  dahili test cihazında dene. Sonra production.

---

## 8. Yeni geliştirici akışı — kısa hatırlatma

JS-only fix yapıyorsan:
```bash
cd mobile
git pull
# değişiklik...
git commit
git push
eas update --branch production --message "<açıklama>"
```

Native değişiklik yapıyorsan (yeni izin, yeni native lib, SDK upgrade):
```bash
cd mobile
# version bump: app.json -> 1.1.2 (örnek)
eas build --platform all --profile production
eas submit --platform all --profile production
# review bekle
```

Şüphedeysen: önce `eas update` deneyebilirsin — `fingerprint` policy ile
EAS uyumsuzluğu otomatik yakalar.
