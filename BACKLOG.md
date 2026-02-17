# Backend Backlog

Son güncelleme: 2026-02-13

## YÜKSEK Öncelik

### 1. Şarj durdurma endpoint'i eksik
- **Durum:** `/api/charge/start` var ama `/api/charge/stop` yok
- **Dosya:** `backend/src/modules/charge/charge.routes.ts`
- **Etki:** Web arayüzü gateway'e doğrudan bağlanarak durdurma yapıyor (auth bypass)
- **Çözüm:** Backend'e `POST /charge/stop` endpoint'i ekle, tenant/kullanıcı yetkisi kontrol et, gateway'e yönlendir

### 2. Askıya alınan firma kontrolü auth'da eksik
- **Durum:** Login ve token yenileme `user.isActive` kontrol ediyor ama `tenant.isSuspended` kontrol etmiyor
- **Dosya:** `backend/src/modules/auth/auth.service.ts`
- **Etki:** Askıya alınan firmanın kullanıcıları hâlâ giriş yapıp API kullanabiliyor
- **Çözüm:** Auth service'te login ve refresh sırasında tenant.isSuspended kontrolü ekle

### 3. Rate limiting yok
- **Durum:** Hiçbir endpoint'te rate limiting uygulanmamış
- **Etki:** Brute force saldırılarına açık (özellikle `/auth/login`)
- **Çözüm:** fastify-rate-limit eklentisi ile login ve kritik endpoint'lere limit koy

## ORTA Öncelik

### 4. Askıya alınan firmalar şarj başlatabiliyor
- **Dosya:** `backend/src/modules/charge/charge.service.ts`
- **Etki:** `startCharge()` tenant durumunu kontrol etmiyor
- **Çözüm:** Şarj başlatmada tenant.isSuspended kontrolü ekle

### 5. chargePointId unique kısıtı firma bazlı değil
- **Dosya:** `backend/src/config/schema.ts` (satır 51)
- **Durum:** chargePointId global olarak unique, firma bazlı değil
- **Etki:** Farklı firmalar aynı chargePointId'yi kullanamıyor
- **Çözüm:** Unique constraint'i `(tenantId, chargePointId)` çifti olarak değiştir

### 6. Gateway bağlantı hatası yönetimi
- **Dosya:** `backend/src/modules/charge/charge.service.ts`
- **Durum:** fetch çağrısı etrafında try-catch eksik; ağ hataları yakalanmıyor
- **Çözüm:** fetch'i try-catch ile sar, anlamlı hata mesajı dön

### 7. Firma silindiğinde hard delete uygulanıyor
- **Dosya:** `backend/src/config/schema.ts` (onDelete: "cascade")
- **Durum:** Firma silinince tüm kullanıcılar, şarj noktaları ve işlemler kalıcı olarak siliniyor
- **Etki:** Geri alma imkânı yok, kullanıcılara bildirim gitmiyor
- **Çözüm:** Soft delete yaklaşımına geçmeyi değerlendir (deletedAt alanı)

### 8. Admin işlemleri için denetim kaydı (audit log) yok
- **Durum:** Firma askıya alma, kullanıcı silme, şarj noktası oluşturma gibi kritik işlemler loglanmıyor
- **Çözüm:** audit_logs tablosu oluştur, admin CRUD işlemlerini kaydet

## DÜŞÜK Öncelik

### 9. Input sanitizasyonu eksik
- **Durum:** Zod ile tip/format doğrulaması var ama HTML/script sanitizasyonu yok
- **Etki:** XSS riski düşük (React otomatik escape yapıyor) ama DB'de kirli veri birikebilir
- **Çözüm:** String alanlarına `.trim()` ve isteğe bağlı sanitize uygulanabilir
