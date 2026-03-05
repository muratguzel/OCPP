import React from 'react'

export const PrivacyPolicyPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white p-8 shadow-sm rounded-lg">
        <h1 className="text-3xl font-bold mb-8 text-center text-gray-900">GİZLİLİK POLİTİKASI</h1>
        
        <div className="prose prose-blue max-w-none text-gray-700">
          <p className="font-semibold mb-6">Son güncelleme: 05.03.2026</p>

          <p className="mb-6">Bu Gizlilik Politikası, Egebilgi Yazılım San. Ltd. Şti. ("Egebilgi Yazılım San. Ltd. Şti." veya "Şirket") tarafından geliştirilen ve işletilen Şarj Modul mobil uygulaması ("Uygulama") aracılığıyla elde edilen kişisel verilerin korunmasına ilişkin esasları açıklamaktadır. Uygulama, App Store (iOS) ve Google Play (Android) platformlarında kullanıma sunulmaktadır.</p>

          <h2 className="text-xl font-bold mt-8 mb-4 text-gray-900">1. Kapsam</h2>
          <p className="mb-6">Bu politika, Uygulamayı indiren, kuran veya kullanan tüm gerçek kişiler için geçerlidir.</p>

          <h2 className="text-xl font-bold mt-8 mb-4 text-gray-900">2. Toplanan Kişisel Veriler</h2>
          <p className="mb-4">Uygulamamız aracılığıyla aşağıdaki kategorilerde kişisel veriler toplanabilir:</p>
          <ul className="list-disc pl-6 mb-6 space-y-2">
            <li><strong>Kimlik Bilgileri:</strong> Ad, soyad ve benzeri tanımlayıcı bilgiler</li>
            <li><strong>İletişim Bilgileri:</strong> E-posta adresi, telefon numarası</li>
            <li><strong>Konum Verisi:</strong> Uygulamanın temel işlevselliği kapsamında, yakınızdaki şarj istasyonlarını göstermek amacıyla anlık veya sürekli konum verisi</li>
            <li><strong>Kullanım Verileri:</strong> Uygulama içi işlem kayıtları, oturum bilgileri, cihaz türü, işletim sistemi sürümü ve uygulama kullanım istatistikleri</li>
            <li><strong>Çerez ve Analitik Veriler:</strong> Kullanıcı deneyimini iyileştirmeye yönelik analitik veriler</li>
          </ul>

          <h2 className="text-xl font-bold mt-8 mb-4 text-gray-900">3. Konum Verisinin Kullanımı</h2>
          <p className="mb-4">Uygulamamız, kullanıcının rızasına dayalı olarak konum verisine erişebilmektedir. Konum verisi yalnızca şu amaçlarla kullanılır:</p>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>Yakındaki şarj istasyonlarının listelenmesi ve harita üzerinde gösterilmesi</li>
            <li>En yakın istasyona yol tarifi sağlanması</li>
            <li>Kullanıcıya özelleştirilmiş hizmet sunulması</li>
          </ul>
          <p className="mb-6">Konum veriniz üçüncü taraflarla izniniz olmaksızın paylaşılmaz. Konum erişimini istediğiniz zaman cihaz ayarlarından kapatabilirsiniz; ancak bu durumda uygulamanın bazı özellikleri çalışmayabilir.</p>

          <h2 className="text-xl font-bold mt-8 mb-4 text-gray-900">4. Verilerin Toplanma Yöntemi ve Hukuki Dayanağı</h2>
          <p className="mb-4">Kişisel verileriniz; Uygulama içi formlar, üyelik işlemleri, cihaz izinleri ve analitik araçlar aracılığıyla, 6698 sayılı Kişisel Verilerin Korunması Kanunu (KVKK) kapsamında aşağıdaki hukuki dayanaklara istinaden toplanmaktadır:</p>
          <ul className="list-disc pl-6 mb-6 space-y-2">
            <li>Uygulamanın çalışmasının sağlanması ve kullanıcı deneyiminin geliştirilmesi</li>
            <li>Sözleşme ilişkisinin kurulması ve yürütülmesi</li>
            <li>Ticari iletişimin sağlanması ve müşteri taleplerine yanıt verilmesi</li>
            <li>Yasal yükümlülüklerin yerine getirilmesi</li>
            <li>Açık rıza alınması koşuluyla pazarlama ve analiz faaliyetleri</li>
          </ul>

          <h2 className="text-xl font-bold mt-8 mb-4 text-gray-900">5. Verilerin Kullanımı ve Aktarımı</h2>
          <p className="mb-6">Toplanan kişisel verileriniz; hizmetlerimizin sunulması, iletişim kurulması, yasal yükümlülüklerin yerine getirilmesi ve kullanıcı deneyiminin geliştirilmesi amaçlarıyla işlenmektedir. Kişisel verileriniz yalnızca yukarıda belirtilen amaçlar doğrultusunda ve yürürlükteki mevzuata uygun olarak; iş ortaklarımız, altyapı tedarikçilerimiz, hukuken yetkili kamu kurumları ve yetkili özel kişilerle paylaşılabilir.</p>

          <h2 className="text-xl font-bold mt-8 mb-4 text-gray-900">6. Üçüncü Taraf Hizmetler</h2>
          <p className="mb-6">Uygulamamız, Google Firebase, Google Maps ve benzeri üçüncü taraf hizmet sağlayıcılarından yararlanabilir. Bu hizmet sağlayıcıların kendi gizlilik politikaları geçerlidir. Söz konusu sağlayıcılar, ilgili platformların gizlilik politikalarına tabidir.</p>

          <h2 className="text-xl font-bold mt-8 mb-4 text-gray-900">7. Kişisel Verilerin Saklanma Süresi</h2>
          <p className="mb-6">Kişisel verileriniz, ilgili mevzuatta öngörülen veya işleme amacı için gerekli olan süre boyunca saklanır. Bu sürenin sona ermesinin ardından verileriniz güvenli biçimde silinir, yok edilir veya anonim hale getirilir.</p>

          <h2 className="text-xl font-bold mt-8 mb-4 text-gray-900">8. Veri Güvenliği</h2>
          <p className="mb-6">Kişisel verilerinizin güvenliğini sağlamak amacıyla endüstri standardı teknik ve idari önlemler uygulanmaktadır. Ancak internet üzerinden yapılan hiçbir veri iletiminin veya elektronik depolamanın %100 güvenli olmadığını hatırlatmak isteriz.</p>

          <h2 className="text-xl font-bold mt-8 mb-4 text-gray-900">9. Veri Sahibinin Hakları (KVKK Madde 11)</h2>
          <p className="mb-4">KVKK kapsamında kişisel verilerinizle ilgili olarak aşağıdaki haklara sahipsiniz:</p>
          <ul className="list-disc pl-6 mb-6 space-y-2">
            <li>Kişisel verilerinizin işlenip işlenmediğini öğrenme</li>
            <li>İşlenmişse buna ilişkin bilgi talep etme</li>
            <li>İşlenme amacını ve amacına uygun kullanılıp kullanılmadığını öğrenme</li>
            <li>Yurt içinde veya yurt dışında aktarıldığı üçüncü kişileri bilme</li>
            <li>Eksik veya yanlış işlenmişse düzeltilmesini isteme</li>
            <li>Mevzuata uygun olarak silinmesini veya yok edilmesini isteme</li>
            <li>Düzeltme ve silme işlemlerinin aktarıldığı üçüncü kişilere bildirilmesini isteme</li>
            <li>Otomatik sistemlerle analiz edilmesi sonucunda aleyhinize bir sonucun ortaya çıkmasına itiraz etme</li>
            <li>Kanuna aykırı işleme nedeniyle uğranılan zararın giderilmesini talep etme</li>
          </ul>

          <h2 className="text-xl font-bold mt-8 mb-4 text-gray-900">10. Platform Gizlilik Politikaları</h2>
          <p className="mb-4">Uygulamamız, aşağıdaki platformlarda yayınlanmaktadır. Bu platformlara ilişkin gizlilik politikaları için ilgili bağlantılara başvurabilirsiniz:</p>
          <ul className="list-disc pl-6 mb-6 space-y-2">
            <li>Apple App Store: <a href="https://www.apple.com/legal/privacy/" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">https://www.apple.com/legal/privacy/</a></li>
            <li>Google Play Store: <a href="https://policies.google.com/privacy" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">https://policies.google.com/privacy</a></li>
          </ul>

          <h2 className="text-xl font-bold mt-8 mb-4 text-gray-900">11. İletişim</h2>
          <p className="mb-4">Kişisel verilerinizle ilgili tüm soru, talep ve şikayetlerinizi aşağıdaki iletişim kanalı üzerinden iletebilirsiniz:</p>
          <ul className="list-disc pl-6 mb-6 space-y-2">
            <li>E-posta: <a href="mailto:info@egebilgi.com.tr" className="text-blue-600 hover:underline">info@egebilgi.com.tr</a></li>
            <li>Web sitesi: <a href="https://sarjmodul.com" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">sarjmodul.com</a></li>
            <li>Şirket: Egebilgi Yazılım San. Ltd. Şti.</li>
          </ul>

          <h2 className="text-xl font-bold mt-8 mb-4 text-gray-900">12. Politika Değişiklikleri</h2>
          <p className="mb-12">Egebilgi Yazılım San. Ltd. Şti., bu Gizlilik Politikası'nı dilediği zaman güncelleme hakkını saklı tutar. Güncellemeler Uygulama veya sarjmodul.com adresinde yayımlandığı tarihten itibaren geçerli olur. Önemli değişiklikler hakkında kullanıcılar uygulama içi bildirim veya e-posta yoluyla bilgilendirilecektir.</p>

          <hr className="my-12 border-gray-200" />

          <h1 className="text-3xl font-bold mb-8 text-center text-gray-900">PRIVACY POLICY</h1>
          <p className="font-semibold mb-6">Last updated: 05.03.2026</p>

          <p className="mb-6">This Privacy Policy describes how Egebilgi Yazılım San. Ltd. Şti. ("Egebilgi Yazılım San. Ltd. Şti." or "Company") collects, uses, and protects personal data obtained through the Şarj Modul mobile application ("App"). The App is available on the App Store (iOS) and Google Play (Android).</p>

          <h2 className="text-xl font-bold mt-8 mb-4 text-gray-900">1. Scope</h2>
          <p className="mb-6">This policy applies to all natural persons who download, install, or use the App.</p>

          <h2 className="text-xl font-bold mt-8 mb-4 text-gray-900">2. Data We Collect</h2>
          <p className="mb-4">We may collect the following categories of personal data through our App:</p>
          <ul className="list-disc pl-6 mb-6 space-y-2">
            <li><strong>Identity Information:</strong> Name, surname, and similar identifying details</li>
            <li><strong>Contact Information:</strong> Email address, phone number</li>
            <li><strong>Location Data:</strong> Real-time or continuous location data to show nearby charging stations as part of the App's core functionality</li>
            <li><strong>Usage Data:</strong> In-app activity logs, session data, device type, OS version, and usage statistics</li>
            <li><strong>Analytics Data:</strong> Data used to improve user experience</li>
          </ul>

          <h2 className="text-xl font-bold mt-8 mb-4 text-gray-900">3. Use of Location Data</h2>
          <p className="mb-4">Our App may access your location data based on your consent. Location data is used exclusively for:</p>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>Listing and displaying nearby charging stations on a map</li>
            <li>Providing directions to the nearest station</li>
            <li>Delivering personalized services to you</li>
          </ul>
          <p className="mb-6">Your location data will not be shared with third parties without your explicit consent. You may disable location access at any time through your device settings; however, some features of the App may not function as a result.</p>

          <h2 className="text-xl font-bold mt-8 mb-4 text-gray-900">4. Legal Basis for Data Collection</h2>
          <p className="mb-4">Your personal data is collected through in-app forms, account registration, device permissions, and analytics tools, based on the following legal grounds under Turkish Personal Data Protection Law No. 6698 (KVKK):</p>
          <ul className="list-disc pl-6 mb-6 space-y-2">
            <li>Ensuring the operation of the App and improving user experience</li>
            <li>Establishment and performance of a contractual relationship</li>
            <li>Business communications and responding to customer requests</li>
            <li>Fulfillment of legal obligations</li>
            <li>Marketing and analytics activities, subject to explicit consent</li>
          </ul>

          <h2 className="text-xl font-bold mt-8 mb-4 text-gray-900">5. Data Use and Sharing</h2>
          <p className="mb-6">Your personal data is processed for the purposes of providing our services, communication, fulfilling legal obligations, and improving user experience. Your data may be shared with our business partners, infrastructure providers, legally authorized public authorities, and authorized private parties, strictly in accordance with the purposes above and applicable law.</p>

          <h2 className="text-xl font-bold mt-8 mb-4 text-gray-900">6. Third-Party Services</h2>
          <p className="mb-6">Our App may use third-party service providers such as Google Firebase, Google Maps, and similar platforms. These providers are governed by their own privacy policies. We encourage you to review those policies independently.</p>

          <h2 className="text-xl font-bold mt-8 mb-4 text-gray-900">7. Data Retention</h2>
          <p className="mb-6">Your personal data is retained for the period prescribed by applicable law or required for the processing purpose. After this period, your data will be securely deleted, destroyed, or anonymized.</p>

          <h2 className="text-xl font-bold mt-8 mb-4 text-gray-900">8. Data Security</h2>
          <p className="mb-6">We implement industry-standard technical and administrative measures to protect your personal data. However, please note that no data transmission over the internet or electronic storage is 100% secure.</p>

          <h2 className="text-xl font-bold mt-8 mb-4 text-gray-900">9. Your Rights (KVKK Article 11)</h2>
          <p className="mb-4">Under KVKK, you have the following rights regarding your personal data:</p>
          <ul className="list-disc pl-6 mb-6 space-y-2">
            <li>To learn whether your personal data has been processed</li>
            <li>To request information if your data has been processed</li>
            <li>To learn the purpose of processing and whether it is used accordingly</li>
            <li>To know third parties to whom your data has been transferred domestically or abroad</li>
            <li>To request correction of incomplete or inaccurate data</li>
            <li>To request deletion or destruction in accordance with applicable law</li>
            <li>To request notification of correction/deletion to third parties to whom data was transferred</li>
            <li>To object to automated processing that produces unfavorable outcomes</li>
            <li>To claim compensation for damages resulting from unlawful data processing</li>
          </ul>

          <h2 className="text-xl font-bold mt-8 mb-4 text-gray-900">10. Platform Privacy Policies</h2>
          <p className="mb-4">Our App is available on the following platforms. Please refer to their respective privacy policies:</p>
          <ul className="list-disc pl-6 mb-6 space-y-2">
            <li>Apple App Store: <a href="https://www.apple.com/legal/privacy/" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">https://www.apple.com/legal/privacy/</a></li>
            <li>Google Play Store: <a href="https://policies.google.com/privacy" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">https://policies.google.com/privacy</a></li>
          </ul>

          <h2 className="text-xl font-bold mt-8 mb-4 text-gray-900">11. Contact</h2>
          <p className="mb-4">For all inquiries, requests, or complaints regarding your personal data, please reach us through:</p>
          <ul className="list-disc pl-6 mb-6 space-y-2">
            <li>Email: <a href="mailto:info@egebilgi.com.tr" className="text-blue-600 hover:underline">info@egebilgi.com.tr</a></li>
            <li>Website: <a href="https://sarjmodul.com" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">sarjmodul.com</a></li>
            <li>Company: Egebilgi Yazılım San. Ltd. Şti.</li>
          </ul>

          <h2 className="text-xl font-bold mt-8 mb-4 text-gray-900">12. Policy Changes</h2>
          <p className="mb-6">Egebilgi Yazılım San. Ltd. Şti. reserves the right to update this Privacy Policy at any time. Updates become effective upon publication in the App or at sarjmodul.com. Users will be notified of significant changes via in-app notification or email.</p>
        </div>
      </div>
    </div>
  )
}
