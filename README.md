# Şarj Modül (sarjmodul)

EV şarj istasyonu yönetim sistemi — monorepo. Backend API, OCPP Gateway, Web arayüzü, simülasyon ve mobil uygulama tek depoda toplanmıştır.

---

## İçindekiler

- [Repo Yapısı (Monorepo)](#repo-yapısı-monorepo)
- [Geliştirici İş Akışı (Contribution)](#geliştirici-iş-akışı-contribution)
- [Sistem Gereksinimleri](#sistem-gereksinimleri)
- [İlk Kurulum ve Çalıştırma](#ilk-kurulum-ve-çalıştırma)
- [Çalışan Servisler ve Erişim](#çalışan-servisler-ve-erişim)
- [Seed (İlk Veri) İşlemi](#seed-ilk-veri-işlemi)
- [Ortam Değişkenleri](#ortam-değişkenleri)
- [Veritabanı Migrasyonları](#veritabanı-migrasyonları)
- [Sadece Yerel Geliştirme (Docker olmadan)](#sadece-yerel-geliştirme-docker-olmadan)
- [Mobil Uygulama (Kurulum ve Test)](#mobil-uygulama-kurulum-ve-test)
- [Sunucuya Deploy (Belirli IP ile)](#sunucuya-deploy-belirli-ip-ile)

---

## Repo Yapısı (Monorepo)

| Dizin | Açıklama |
|-------|----------|
| `backend/` | Node.js (Express) REST API — auth, tenant, kullanıcı, şarj noktası, işlemler |
| `ocpp-gateway/` | OCPP WebSocket sunucusu — şarj noktaları ile protokol iletişimi |
| `web/` | React (Vite) web arayüzü |
| `simulation/` | Sanal OCPP şarj noktası simülasyonu (test için) |
| `mobile/` | Expo (React Native) mobil uygulama |

---

## Geliştirici İş Akışı (Contribution)

Kendi makinenizde katkı yapmak için aşağıdaki adımları izleyin.

### 1. Repoyu klonlama ve güncel kodu çekme

```bash
# Repoyu klonlayın (ilk kez)
git clone https://github.com/<org>/sarjmodul.git
cd sarjmodul

# Güncel kodu almak için (zaten klonladıysanız)
git fetch origin
git pull origin develop
```

Varsayılan ana geliştirme dalı `develop` kabul edilir; farklı bir ana dal kullanılıyorsa `develop` yerine o dalı kullanın.

### 2. Yeni branch açma

Özellik veya düzeltme için her zaman yeni bir branch açın; doğrudan `develop` (veya `main`) üzerinde commit yapmayın.

```bash
# Güncel dalı çektikten sonra
git checkout develop
git pull origin develop

# Yeni branch oluşturup geçin
git checkout -b feature/ozellik-adi
# veya
git checkout -b fix/hata-aciklamasi
```

Branch isimlendirme örnekleri: `feature/tek-oturum-login`, `fix/login-409-mesaj`, `docs/readme-guncelleme`.

### 3. Değişiklik yapma ve commit

```bash
# Değişiklikleri stage'e alın
git add .
# veya belirli dosyalar
git add backend/src/modules/auth/auth.service.ts

# Commit (anlamlı mesaj)
git commit -m "feat(auth): tek oturum için user:session Redis kontrolü eklendi"
```

Commit mesajları için tercih: `tür(scope): kısa açıklama` (örn. `feat`, `fix`, `docs`, `chore`).

### 4. Push ve Pull Request

```bash
# Branch'i uzak repoya gönderin
git push -u origin feature/ozellik-adi
```

GitHub/GitLab üzerinden **Pull Request (MR)** açın: `feature/ozellik-adi` → `develop`. Kod incelemesi sonrası merge edilir.

### 5. Merge sonrası yerel güncelleme

```bash
git checkout develop
git pull origin develop
# Gerekirse eski feature branch'i silebilirsiniz
git branch -d feature/ozellik-adi
```

---

## Sistem Gereksinimleri

- **Docker & Docker Compose** (tüm sistemi ayağa kaldırmak için)
- **Node.js 18+** (backend, ocpp-gateway, web; yerel çalıştırma için)
- **Git**

---

## İlk Kurulum ve Çalıştırma

Tüm servisleri (PostgreSQL, Redis, Backend, OCPP Gateway, Web, Simülasyon) tek komutla çalıştırmak için:

```bash
# Repo kök dizininde
cd sarjmodul

# Tüm servisleri build edip başlat
docker compose up --build
```

İlk çalıştırmada image'lar build edilir; süre birkaç dakika sürebilir. Servisler ayağa kalktıktan sonra:

1. **Veritabanı migrasyonu** ve **seed** işlemini yapın (aşağıda).
2. Tarayıcıdan **Web arayüzü**ne ve **API**ye erişin (portlar aşağıda).

Arka planda çalıştırmak için:

```bash
docker compose up -d --build
```

Durdurmak için:

```bash
docker compose down
```

---

## Çalışan Servisler ve Erişim

`docker compose up` ile ayağa kalkan servisler ve erişim bilgileri:

| Servis | Port (host) | Açıklama | Erişim |
|--------|-------------|----------|--------|
| **Web (frontend)** | **5173** | React arayüzü | http://localhost:5173 |
| **Backend API** | **4000** | REST API (health, auth, tenant, charge-point, vb.) | http://localhost:4000/api |
| **OCPP Gateway (HTTP)** | **3000** | Gateway HTTP (health vb.) | http://localhost:3000 |
| **OCPP Gateway (WebSocket)** | **9220** | Şarj noktaları OCPP bağlantısı | ws://localhost:9220 |
| **PostgreSQL** | **5432** | Veritabanı | `localhost:5432`, kullanıcı: `postgres`, şifre: `postgres`, DB: `sarjmodul` |
| **Redis** | **6379** | Cache / oturum | `localhost:6379` |
| **Simulation** | — | Sanal şarj noktaları (OCPP Gateway'e bağlanır) | Logları görmek için: `docker compose logs -f simulation` |

Özet:

- **Kullanıcı arayüzü:** http://localhost:5173  
- **API (ör. health):** http://localhost:4000/api/health  
- **İlk giriş:** Seed ile oluşturulan Super Admin hesabı (e-posta/şifre aşağıda).

---

## Seed (İlk Veri) İşlemi

İlk kurulumda veritabanında **Super Admin** kullanıcısı yoktur; giriş yapabilmek için seed çalıştırılmalıdır.

### Docker ile çalışırken

Backend container'ı içinde seed çalıştırın:

```bash
docker compose exec backend npm run seed
```

Bu komut:

- `DATABASE_URL` ve `SEED_*` değişkenlerini `docker-compose.yml` içinden alır.
- Eğer `SEED_EMAIL` ile bir kullanıcı zaten varsa seed atlanır; yoksa bir tane Super Admin oluşturulur.

Varsayılan seed hesabı (docker-compose’daki env’e göre):

- **E-posta:** `admin@sarjmodul.com`
- **Şifre:** `Admin123!`
- **İsim:** Super Admin

### Veritabanı migrasyonu (ilk kez)

Seed’den önce tabloların var olması gerekir. Migrasyonu backend container’da şu şekilde uygulayın:

```bash
docker compose exec backend npm run db:migrate
```

Özet sıra:

1. `docker compose up -d --build`
2. `docker compose exec backend npm run db:migrate`
3. `docker compose exec backend npm run seed`
4. http://localhost:5173 üzerinden `admin@sarjmodul.com` / `Admin123!` ile giriş yapın.

---

## Ortam Değişkenleri

Her servisin kendi `.env` / `.env.example` dosyası vardır. Docker ile çalışırken çoğu değer `docker-compose.yml` içinden gelir.

- **backend:** `backend/.env.example` → `backend/.env`  
  Özellikle: `DATABASE_URL`, `REDIS_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, `SEED_EMAIL`, `SEED_PASSWORD`, `SEED_NAME`
- **web:** `web/.env.example` → `web/.env`  
  `VITE_API_URL`, `VITE_OCPP_GATEWAY_URL` (development’ta proxy kullanılıyorsa `/api` ve `http://localhost:3000` yeterli)
- **ocpp-gateway:** `ocpp-gateway/.env.example` → `ocpp-gateway/.env`  
  `PORT`, `OCPP_PORT`, `BACKEND_API_URL`

Seed değişkenleri (opsiyonel): `SEED_NUMARATAJ`, `SEED_PHONE` — backend `seed.ts` içinde kullanılır.

---

## Veritabanı Migrasyonları

Şema değişikliği yaptıysanız:

```bash
# Migration SQL üret
cd backend && npm run db:generate

# Migration'ı uygula (Docker içinde)
docker compose exec backend npm run db:migrate
```

Yerel çalıştırıyorsanız:

```bash
cd backend
# .env'de DATABASE_URL tanımlı olmalı
npm run db:migrate
```

---

## Sadece Yerel Geliştirme (Docker olmadan)

1. **PostgreSQL** ve **Redis**’i yerelde çalıştırın (veya mevcut bir instance’a bağlanın).
2. **backend:**  
   `backend/.env` düzenleyin (`DATABASE_URL`, `REDIS_URL` yerel adreslere göre).  
   `npm ci && npm run db:migrate && npm run seed && npm run dev` (port 3000 veya env’deki PORT).
3. **ocpp-gateway:**  
   `ocpp-gateway/.env` ile `BACKEND_API_URL` vb. ayarlayıp `npm run dev`.
4. **web:**  
   `web/.env` ile `VITE_API_URL` (örn. `http://localhost:4000` veya proxy için `/api`).  
   `npm run dev` → http://localhost:5173 (Vite proxy ile `/api` → backend’e yönlenir).

Not: Backend’i 4000’de çalıştırmak için `backend/.env` içinde `PORT=4000` kullanabilirsiniz; böylece web’in proxy hedefi ile uyumlu olur.

---

## Mobil Uygulama (Kurulum ve Test)

Projeyi pull ettikten sonra mobil uygulamayı yerelde çalıştırmak için aşağıdaki adımları izleyin.

### Gereksinimler

- **Node.js 18+**
- **npm** veya **yarn**
- **Expo Go** uygulaması (fiziksel cihazda test için) veya **iOS Simulator** / **Android Emulator**

### 1. Bağımlılıkları yükleme

```bash
cd mobile
npm install
```

veya kilidi kullanmak için:

```bash
cd mobile
npm ci
```

### 2. Ortam değişkenlerini ayarlama

`mobile/.env.example` dosyasını kopyalayıp `.env` oluşturun (henüz yoksa):

```bash
cp .env.example .env
```

`.env` içinde API ve OCPP Gateway adreslerini ortamınıza göre düzenleyin:

| Ortam | EXPO_PUBLIC_BACKEND_API_URL | EXPO_PUBLIC_OCPP_GATEWAY_URL |
|-------|-----------------------------|------------------------------|
| **iOS Simulator** | `http://localhost:4000` | `http://localhost:3000` |
| **Android Emulator** | `http://10.0.2.2:4000` | `http://10.0.2.2:3000` |
| **Fiziksel cihaz** | `http://BILGISAYAR_IP:4000` | `http://BILGISAYAR_IP:3000` |

Fiziksel cihazda test ederken bilgisayarınızın yerel IP’sini (örn. `192.168.1.10`) kullanın; cihaz ve bilgisayar aynı ağda olmalıdır.

### 3. Uygulamayı çalıştırma

Backend ve OCPP Gateway’in çalışıyor olduğundan emin olun (Docker ile `docker compose up -d` veya yerelde ayrı terminallerde).

```bash
cd mobile
npm start
```

Expo Dev Tools açılır. Sonrasında:

- **iOS Simulator:** Terminalde `i` tuşuna basın veya `npm run ios` çalıştırın (macOS + Xcode gerekir).
- **Android Emulator:** Terminalde `a` tuşuna basın veya `npm run android` çalıştırın (Android Studio + emülatör gerekir).
- **Fiziksel cihaz:** Telefona **Expo Go** yükleyin; QR kodu Expo Go ile tarayın veya aynı ağdaki “Enter URL manually” ile gösterilen adresi girin.

### 4. Test etme

1. Uygulama açıldığında **giriş** ekranı gelir.
2. Seed ile oluşturulan hesap bilgileriyle giriş yapın:
   - **E-posta:** `admin@sarjmodul.com`
   - **Şifre:** `Admin123!`
3. Giriş başarılıysa ana ekrana (şarj noktaları / işlemler vb.) geçiş yapılır.
4. Backend erişilemiyorsa “Network request failed” benzeri hata alırsınız; `.env` adreslerini ve backend’in ayakta olduğunu kontrol edin.

### Özet: Mobil komutlar

| Amaç | Komut |
|------|--------|
| Bağımlılık yükle | `cd mobile && npm install` |
| Geliştirme sunucusu | `cd mobile && npm start` |
| iOS’ta aç | `cd mobile && npm run ios` |
| Android’de aç | `cd mobile && npm run android` |

`.env` değiştirdikten sonra Expo’yu yeniden başlatın (`Ctrl+C` ile durdurup tekrar `npm start`).

### Sık karşılaşılan hatalar

**`Cannot find module './buildCacheProvider'`** (Expo start sırasında)

Bu hata normal değildir; genelde `node_modules` veya önbelleğin bozuk/uyumsuz olmasından kaynaklanır. Şunları deneyin:

1. **Temiz kurulum** (çoğu durumda yeterli):

```bash
cd mobile
rm -rf node_modules package-lock.json
npm install
npm start
```

2. Hata sürerse **Expo bağımlılıklarını hizala**:

```bash
cd mobile
npx expo install --fix
npm start
```

3. Yine olmazsa **npm önbelleğini temizleyip** tekrar kurun:

```bash
cd mobile
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
npm start
```

---

## Sunucuya Deploy (Belirli IP ile)

Projeyi bir sunucuya (örn. **209.38.226.171**) atıp `docker compose up` ile çalıştırdığınızda, web arayüzü ve **mobil uygulama**’nın doğru adreslere istek atması için aşağıdakileri yapın.

### 1. Web (tarayıcı) için

Web build sırasında OCPP Gateway adresi gömülür. Sunucu IP’nizi build argümanı olarak verin:

- **Repo kökünde** bir `.env` dosyası oluşturun (veya mevcut `.env`’i düzenleyin):

```bash
# Sunucu IP’nize göre (örnek: 209.38.226.171)
VITE_OCPP_GATEWAY_URL=http://209.38.226.171:3000
```

- Ardından web’i yeniden build edip tüm yığıı ayağa kaldırın:

```bash
docker compose up --build -d
```

Tarayıcıdan `http://209.38.226.171:5173` (veya web’in yayınlandığı port) açıldığında API istekleri aynı sunucuya gidecek; `/api` nginx ile backend’e proxy edilir.

### 2. Mobil uygulama için

Mobil uygulama API ve OCPP Gateway adreslerini **build anında** `.env`’den alır. Fiziksel cihazdan veya emülatörden sunucuya bağlanacaksanız:

- **`mobile/.env`** dosyasını sunucu IP’nize göre ayarlayın:

```bash
EXPO_PUBLIC_OCPP_GATEWAY_URL=http://209.38.226.171:3000
EXPO_PUBLIC_BACKEND_API_URL=http://209.38.226.171:4000
```

- `.env` değiştirdikten sonra uygulamayı yeniden başlatın / yeniden build alın (Expo’da `npm start` sonrası değişiklik için bazen yeniden başlatma gerekir).

Böylece mobil istemci 209.38.226.171’deki backend (4000) ve OCPP Gateway’e (3000) istek atar.

### 3. Özet: Değişen yerler

| Nerede | Ne yapılır |
|--------|-------------|
| **Repo kökü `.env`** | `VITE_OCPP_GATEWAY_URL=http://209.38.226.171:3000` → web build’te kullanılır |
| **`mobile/.env`** | `EXPO_PUBLIC_OCPP_GATEWAY_URL` ve `EXPO_PUBLIC_BACKEND_API_URL` sunucu IP ile (3000 ve 4000 portları) |
| **Backend CORS** | Varsayılan `cors()` tüm origin’lere izin verir; ek ayar gerekmez. |
| **Docker Compose** | Portlar (`4000`, `3000`, `9220`, `5173`) sunucuda açık olmalı; firewall’da bu portlara izin verin. |

Fiziksel şarj noktaları OCPP WebSocket ile bağlanacaksa **9220** portunun da sunucuya erişilebilir olması gerekir (örn. `ws://209.38.226.171:9220`).

---

## Özet Komutlar

| Amaç | Komut |
|------|--------|
| Tüm sistemi başlat | `docker compose up --build` |
| Arka planda başlat | `docker compose up -d --build` |
| Migrasyon uygula | `docker compose exec backend npm run db:migrate` |
| Seed çalıştır | `docker compose exec backend npm run seed` |
| Mobil uygulama başlat | `cd mobile && npm install && npm start` |
| Durdur | `docker compose down` |
| Logları izle | `docker compose logs -f [service_adı]` |

---

Bu README, monorepo’yu kendi makinenizde çalıştırma, katkı (pull, branch, commit, PR) ve sistemi kullanma (hangi servis nerede, seed, migrasyon) için gerekli talimatları kapsar. Güncellemek istediğiniz bir bölüm olursa PR ile önerebilirsiniz.
