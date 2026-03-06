# Expo ve EAS CLI Komut Listesi

Bu dokümanda, Şarj Modül uygulamanız için bugüne kadar kullandığımız ve ileride uygulamanızı yönetirken (derleme, yayınlama, test) ihtiyacınız olabilecek en temel Expo ve EAS (Expo Application Services) komutlarını bulabilirsiniz.

## 1. Kurulum ve Başlangıç Komutları

*   **`npx create-expo-app <proje_adi>`**
    *   Sıfırdan yeni bir Expo projesi başlatır.

*   **`npx expo start` veya `npm start`**
    *   Uygulamanızı geliştirme ortamında (Expo Go uygulamasında okutarak denemek için) çalıştırır. Canlı kod değişikliklerini anında telefonda görmenizi sağlar.

*   **`npm install <paket_adi>` / `npx expo install <paket_adi>`**
    *   Projenize yeni bir modül/kütüphane ekler. (Expo ile uyumlu paket versiyonunu seçmek için `npx expo install` önerilir).

## 2. Derleme (Build) Komutları - EAS Build

Bu komutlar, yazdığınız Javascript/TypeScript kodlarını mağazalara yüklenebilecek gerçek iOS (`.ipa`) ve Android (`.aab` veya `.apk`) paketlerine dönüştürmeye yarar. Bulut sunucularında (Expo tarafında) çalışır.

*   **`eas build -p ios --profile production`**
    *   App Store'a yüklemek üzere iOS için Production (Canlı) profiliyle `.ipa` derlemesi (build) alır.

*   **`eas build -p android --profile production`**
    *   Google Play Store'a yüklemek üzere Android için Production profiliyle `.aab` (Android App Bundle) derlemesi alır. Mağazaya yüklemek için gereken formattır.

*   **`eas build --profile development`**
    *   Uygulamanızı bilgisayara/test telefonuna kabloyla kurmalık bir test paketi oluşturur (Production profilinden farklıdır).

*   **`eas build:list`**
    *   Geçmişte aldığınız tüm derlemelerin (başarılı/başarısız) listesini terminalde gösterir.

## 3. Mağazalara Gönderme (Submit) Komutları - EAS Submit

Build komutlarıyla oluşturulan `.ipa` veya `.aab` paketlerini doğrudan Apple App Store Connect veya Google Play Console sunucularına aktaran (upload eden) komutlardır.

*   **`eas submit -p ios --latest`**
    *   EAS üzerinde başarıyla alınmış **en son** iOS derlemenizi otomatik olarak App Store Connect hesabınıza yükler. (App Store Connect'teki *"Unable to Add for Review"* tarafındaki ön koşulları sağladıysanız hatasız tamamlanır).

*   **`eas submit -p android --latest`**
    *   EAS üzerinde başarıyla alınmış **en son** Android derlemenizi Google Play Console'a yükler. (Not: Google Play kuralları gereği, uygulamanızın ilk versiyon paketini (.aab dosyası) **mutlaka** tarayıcı üzerinden elle Google Play paneline sürükleyerek yüklemelisiniz. Ancak ikinci güncellemeden itibaren bu komutla otomatik gönderim yapabilirsiniz).

## 4. Kimlik ve Sertifika Yönetimi

Mağazalara uygulama atabilmek için gereken sertifikaları yönetmeye yarar (Genelde `eas build` komutu bunları ilk defa çalıştırdığınızda otomatik sorup halleder).

*   **`eas credentials`**
    *   Projenizin iOS (Dağıtım sertifikaları, Provisioning profilleri) ve Android (Keystore şifreleri) kimlik bilgilerini yönetmenizi sağlayan etkileşimli bir menü açar.

## 5. Canlı Güncelleme Komutları (OTA - Over The Air)

Uygulamanızı mağazaya, App Store onayına, incelemeye sunmadan; uygulamasını cihazlarına indirmiş kullanıcılara **canlı** kod (örneğin ufak UI, metin değişiklikleri, bug-fix'ler) güncellemeleri göndermeye yarar. EAS Update olarak geçer.

*   **`eas update --branch production --message "Ufak arayüz hataları giderildi"`**
    *   Uygulamadaki son javascript kodlarınızı derleyip bir paket oluşturur ve bunu doğrudan kullanıcıların telefonlarına basar. Kullanıcı uygulamayı kapatıp açtığında yeni versiyonla karşılaşır (Native kod değişiklikleri gerektirmeyen güncellemelerde müthiş zaman kazandırır).

## 6. Proje Yapılandırma ve Hata Ayıklama

*   **`npx expo prebuild --platform <ios|android> --clean`**
    *   (Daha önce ikon küçülme sorunuyla uğraştığımız sırada kullandık). Expo projesindeki JavaScript/React kodlarını, arka planda ham iOS ve Android (Native) kodlarına (*.xcodeproj* ve *build.gradle* formatında) dönüştürür. Build hatalarını lokalde simüle etmek veya çözmek için çok yararlıdır.

*   **`eas update:configure`**
    *   Projenizde yukarıdaki `eas update` (canlı güncelleme) özelliğini ilk defa aktifleştirecekseniz gerekli ayarları projeye geçirir.

*   **`eas build:view <build_id>`**
    *   Belirli bir ID'ye (koduna) sahip bir build işleminin terminalde özet sonucunu, detay linklerini almanızı sağlar.

## Notlar: Versiyon Güncelleme
Uygulamanız canlıdayken bir güncelleme yapacağınızda:
1.  Apple ve Google panellerinin çakışmaması (Build Number Collision) için `eas.json` dosyasında ayarlı olan otomatik "autoIncrement" (otomatik sürüm artışı) kullanılır.
2.  Ancak **Kullanıcıların göreceği Semantic sürümü** (1.0'dan 1.1'e geçiş gibi) siz elle `app.json` dosyasına girip değiştirmelisiniz. Sonrasında `eas build` diyerek işlemi başlatırsınız.
