# Şarj Modül – Çalıştırma Todo Listesi

Projeyi ayağa kaldırmak için yapman gereken adımlar. **Docker kullanıyorsan** sadece "Docker ile" bölümünü, **bilgisayarında doğrudan çalıştıracaksan** "Lokal" bölümünü takip et.

---

## Docker ile çalıştırma

| # | Yapılacak | Komut / Not |
|---|-----------|--------------|
| 1 | Servisleri başlat | `docker compose up` (veya arka plan: `docker compose up -d`) |
| 2 | Veritabanı tablolarını oluştur | `docker compose exec backend npm run db:push` |
| 3 | Super Admin kullanıcısını oluştur | `docker compose exec backend npx tsx src/seed.ts` |

**Not:** Docker Compose içinde tüm environment değişkenleri tanımlı; `.env` dosyası **zorunlu değil**. İstersen backend için `.env` oluşturup sadece JWT vb. değerleri değiştirebilirsin (docker-compose’daki `environment` bunları override eder).

**Erişim:**
- Backend API: http://localhost:4000 (örn. http://localhost:4000/api/health)
- OCPP Gateway HTTP: http://localhost:3000
- OCPP WebSocket: ws://localhost:9220
- PostgreSQL: localhost:5432 (kullanıcı: postgres, şifre: postgres, DB: sarjmodul)
- Redis: localhost:6379

---

## Lokal çalıştırma (Docker kullanmıyorsan)

| # | Yapılacak | Komut / Not |
|---|-----------|--------------|
| 1 | Backend için `.env` oluştur | `cp backend/.env.example backend/.env` |
| 2 | Backend `.env` içindeki değerleri kontrol et | `DATABASE_URL`, `REDIS_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET` (en az 16 karakter) |
| 3 | PostgreSQL’i çalıştır | Bilgisayarında PostgreSQL servisi açık olsun |
| 4 | `sarjmodul` veritabanını oluştur | `createdb sarjmodul` veya pgAdmin / psql ile oluştur |
| 5 | Redis’i çalıştır | `redis-server` veya sistemde Redis servisini başlat |
| 6 | Backend bağımlılıkları | `cd backend && npm install` |
| 7 | Veritabanı tablolarını oluştur | `cd backend && npm run db:push` |
| 8 | Super Admin kullanıcısını oluştur | `cd backend && npm run seed` |
| 9 | Backend’i başlat | `cd backend && npm run dev` |
| 10 | (İsteğe bağlı) OCPP Gateway için `.env` | `cp ocpp-gateway/.env.example ocpp-gateway/.env` – portları istersen değiştir |
| 11 | OCPP Gateway’i başlat | `cd ocpp-gateway && npm install && npm run dev` |

---

## Özet kontrol listesi (Docker)

- [ ] `docker compose up` çalıştırdım
- [ ] `docker compose exec backend npx drizzle-kit push` ile tabloları oluşturdum
- [ ] `docker compose exec backend npx tsx src/seed.ts` ile Super Admin’i oluşturdum
- [ ] http://localhost:4000/api/health ile backend’i test ettim
- [ ] Giriş için: POST http://localhost:4000/api/auth/login — body: `{"email":"admin@sarjmodul.com","password":"Admin123!"}`

## Özet kontrol listesi (Lokal)

- [ ] `backend/.env` dosyasını oluşturdum ve düzenledim
- [ ] PostgreSQL ve Redis çalışıyor, `sarjmodul` veritabanı var
- [ ] Backend’de `npm run db:push` ve `npm run seed` yaptım
- [ ] Backend’i `npm run dev` ile başlattım
- [ ] (İsteğe bağlı) OCPP Gateway’i `npm run dev` ile başlattım
