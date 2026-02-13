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

## Özet Komutlar

| Amaç | Komut |
|------|--------|
| Tüm sistemi başlat | `docker compose up --build` |
| Arka planda başlat | `docker compose up -d --build` |
| Migrasyon uygula | `docker compose exec backend npm run db:migrate` |
| Seed çalıştır | `docker compose exec backend npm run seed` |
| Durdur | `docker compose down` |
| Logları izle | `docker compose logs -f [service_adı]` |

---

Bu README, monorepo’yu kendi makinenizde çalıştırma, katkı (pull, branch, commit, PR) ve sistemi kullanma (hangi servis nerede, seed, migrasyon) için gerekli talimatları kapsar. Güncellemek istediğiniz bir bölüm olursa PR ile önerebilirsiniz.
