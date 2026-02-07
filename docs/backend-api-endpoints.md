# Backend API – Endpoint’ler ve cURL Örnekleri

Tüm istekler `/api` prefix’i ile yapılır. Docker ile çalışıyorsan base URL: `http://localhost:4000`.

**Kimlik doğrulama:** `Authorization: Bearer <access_token>` header’ı gerekli endpoint’lerde kullanılır. Token, `POST /api/auth/login` ile alınır.

---

## Health

### GET /api/health

Sunucu sağlık kontrolü. Kimlik doğrulama gerekmez.

```bash
curl -s http://localhost:4000/api/health
```

**Örnek yanıt:**
```json
{"status":"ok","timestamp":"2025-02-07T19:00:00.000Z"}
```

---

## Auth

### POST /api/auth/login

E-posta ve şifre ile giriş; access ve refresh token döner.

**Body:** `email`, `password` (JSON)

```bash
curl -s -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@sarjmodul.com","password":"Admin123!"}'
```

**Örnek yanıt:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "uuid",
    "email": "admin@sarjmodul.com",
    "name": "Super Admin",
    "role": "super_admin"
  }
}
```

---

### POST /api/auth/refresh

Refresh token ile yeni access ve refresh token alır.

**Body:** `refreshToken` (JSON)

```bash
curl -s -X POST http://localhost:4000/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refreshToken":"EYJHBGCIOIJIUZI1NII..."}'
```

**Örnek yanıt:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

---

### POST /api/auth/logout

Refresh token’ı geçersiz kılar (Redis’ten siler). Giriş yapmış kullanıcı gerekir.

**Headers:** `Authorization: Bearer <access_token>`  
**Body:** `refreshToken` (JSON)

```bash
curl -s -X POST http://localhost:4000/api/auth/logout \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{"refreshToken":"EYJHBGCIOIJIUZI1NII..."}'
```

**Örnek yanıt:**
```json
{"message":"Logged out successfully"}
```

---

### GET /api/auth/me

Giriş yapmış kullanıcının profil bilgisi.

**Headers:** `Authorization: Bearer <access_token>`

```bash
curl -s http://localhost:4000/api/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Örnek yanıt:**
```json
{
  "id": "uuid",
  "email": "admin@sarjmodul.com",
  "name": "Super Admin",
  "role": "super_admin",
  "tenantId": null,
  "isActive": true,
  "createdAt": "2025-02-07T19:00:00.000Z"
}
```

Admin kullanıcılarda `tenantId` ve (varsa) `tenantName` de döner.

---

## Tenants

Sadece **Super Admin** tenant CRUD yapabilir. Tüm isteklerde `Authorization: Bearer <access_token>` gerekir.

---

### GET /api/tenants

Tenant listesi.

```bash
curl -s http://localhost:4000/api/tenants \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Örnek yanıt:**
```json
[
  {
    "id": "uuid",
    "name": "Acme Şarj",
    "createdAt": "2025-02-07T19:00:00.000Z",
    "updatedAt": "2025-02-07T19:00:00.000Z"
  }
]
```

---

### GET /api/tenants/:id

Tek tenant detayı.

```bash
curl -s http://localhost:4000/api/tenants/TENANT_UUID \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

### POST /api/tenants

Yeni tenant oluşturur.

**Body:** `name` (zorunlu)

```bash
curl -s -X POST http://localhost:4000/api/tenants \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{"name":"Acme Şarj"}'
```

**Örnek yanıt (201):**
```json
{
  "id": "uuid",
  "name": "Acme Şarj",
  "createdAt": "2025-02-07T19:00:00.000Z",
  "updatedAt": "2025-02-07T19:00:00.000Z"
}
```

---

### PATCH /api/tenants/:id

Tenant adını günceller.

**Body:** `name` (zorunlu)

```bash
curl -s -X PATCH http://localhost:4000/api/tenants/TENANT_UUID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{"name":"Acme Şarj A.Ş."}'
```

---

### DELETE /api/tenants/:id

Tenant siler.

```bash
curl -s -X DELETE http://localhost:4000/api/tenants/TENANT_UUID \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

## Users

Aşağıdaki tüm endpoint’ler **Authorization: Bearer &lt;access_token&gt;** gerektirir. **Hiyerarşi:** Super Admin tenant ve admin oluşturur; her Admin bir tenant’a bağlıdır ve sadece o tenant’taki user’ları yönetir.

---

### GET /api/users

Kullanıcı listesi. **Super Admin:** tüm kullanıcılar (opsiyonel `?tenantId=uuid` ile filtre); **Admin:** sadece kendi tenant’ındaki kullanıcılar.

```bash
# Tüm kullanıcılar (Super Admin)
curl -s http://localhost:4000/api/users -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

# Belirli tenant’a göre filtre (Super Admin)
curl -s "http://localhost:4000/api/users?tenantId=TENANT_UUID" -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

```bash
curl -s http://localhost:4000/api/users \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Örnek yanıt:**
```json
[
  {
    "id": "uuid",
    "email": "user@example.com",
    "name": "Kullanıcı Adı",
    "role": "user",
    "tenantId": "uuid",
    "isActive": true,
    "createdById": "uuid",
    "createdAt": "2025-02-07T19:00:00.000Z"
  }
]
```

---

### GET /api/users/:id

Tek kullanıcı detayı. Kendi profiline veya (Admin/Super Admin için) yetkili olduğun kullanıcıya erişilebilir.

```bash
curl -s http://localhost:4000/api/users/USER_UUID \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Örnek yanıt:**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "name": "Kullanıcı Adı",
  "role": "user",
  "isActive": true,
  "tenantId": "uuid",
  "createdById": "uuid",
  "createdAt": "2025-02-07T19:00:00.000Z",
  "updatedAt": "2025-02-07T19:00:00.000Z"
}
```

---

### POST /api/users

Yeni kullanıcı oluşturur.

- **Super Admin:** Admin oluştururken `tenantId` (uuid) ve `role: "admin"` zorunlu. User oluştururken `tenantId` ve `role: "user"` zorunlu.
- **Admin:** Sadece `role: "user"`; body’de `tenantId` gönderilmez, kullanıcı otomatik olarak admin’in tenant’ına eklenir.

**Body (Super Admin – admin):** `email`, `password`, `name`, `role: "admin"`, `tenantId`  
**Body (Super Admin – user):** `email`, `password`, `name`, `role: "user"`, `tenantId`  
**Body (Admin – user):** `email`, `password`, `name` (role varsayılan "user", tenantId yok)

```bash
# Super Admin: Yeni admin (tenantId zorunlu)
curl -s -X POST http://localhost:4000/api/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "email": "admin@tenant.com",
    "password": "GuvenliSifre123",
    "name": "Tenant Admin",
    "role": "admin",
    "tenantId": "TENANT_UUID"
  }'

# Admin: Yeni user (tenantId gönderilmez)
curl -s -X POST http://localhost:4000/api/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "email": "yeni@example.com",
    "password": "GuvenliSifre123",
    "name": "Yeni Kullanıcı"
  }'
```

**Örnek yanıt (201):**
```json
{
  "id": "uuid",
  "email": "yeni@example.com",
  "name": "Yeni Kullanıcı",
  "role": "user",
  "tenantId": "uuid",
  "isActive": true,
  "createdAt": "2025-02-07T19:00:00.000Z"
}
```

---

### PATCH /api/users/:id

Kullanıcı günceller. Kullanıcı kendi profilini; Admin/Super Admin yetkili oldukları kullanıcıları güncelleyebilir. `isActive` sadece Admin/Super Admin değiştirebilir.

**Body:** `email`, `password`, `name`, `isActive` (hepsi opsiyonel)

```bash
curl -s -X PATCH http://localhost:4000/api/users/USER_UUID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{"name":"Güncel Ad","email":"guncel@example.com"}'
```

**Örnek yanıt:**
```json
{
  "id": "uuid",
  "email": "guncel@example.com",
  "name": "Güncel Ad",
  "role": "user",
  "tenantId": "uuid",
  "isActive": true,
  "updatedAt": "2025-02-07T19:00:00.000Z"
}
```

---

### DELETE /api/users/:id

Kullanıcıyı **pasif** yapar (soft delete: `isActive: false`). Sadece Admin/Super Admin. Kendi hesabını silemez.

```bash
curl -s -X DELETE http://localhost:4000/api/users/USER_UUID \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Örnek yanıt:**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "name": "Kullanıcı Adı",
  "tenantId": "uuid",
  "isActive": false
}
```

---

## Charge Points

Her charge point bir **tenant**’a bağlıdır. **Super Admin** tüm charge point’leri yönetir (opsiyonel `?tenantId=` ile filtre); **Admin** sadece kendi tenant’ındaki charge point’leri listeler ve CRUD yapar. `chargePointId`, OCPP istasyonunun bağlanırken kullandığı kimliktir (sistem genelinde tekil).

Tüm isteklerde `Authorization: Bearer <access_token>` gerekir.

---

### GET /api/charge-points

Charge point listesi. **Super Admin:** tümü veya `?tenantId=uuid` ile filtre; **Admin:** sadece kendi tenant’ı.

```bash
curl -s http://localhost:4000/api/charge-points \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

# Super Admin: belirli tenant’a göre filtre
curl -s "http://localhost:4000/api/charge-points?tenantId=TENANT_UUID" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Örnek yanıt:**
```json
[
  {
    "id": "uuid",
    "tenantId": "uuid",
    "chargePointId": "CP001",
    "name": "İstasyon A",
    "isActive": true,
    "createdAt": "2025-02-07T19:00:00.000Z",
    "updatedAt": "2025-02-07T19:00:00.000Z"
  }
]
```

---

### GET /api/charge-points/:id

Tek charge point detayı.

```bash
curl -s http://localhost:4000/api/charge-points/CP_UUID \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

### POST /api/charge-points

Yeni charge point ekler. **Admin** sadece kendi tenant’ı için `tenantId` gönderir.

**Body:** `tenantId` (uuid, zorunlu), `chargePointId` (string, OCPP kimliği, tekil), `name` (string, opsiyonel)

```bash
curl -s -X POST http://localhost:4000/api/charge-points \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "tenantId": "TENANT_UUID",
    "chargePointId": "CP001",
    "name": "İstasyon A"
  }'
```

**Örnek yanıt (201):**
```json
{
  "id": "uuid",
  "tenantId": "uuid",
  "chargePointId": "CP001",
  "name": "İstasyon A",
  "isActive": true,
  "createdAt": "2025-02-07T19:00:00.000Z",
  "updatedAt": "2025-02-07T19:00:00.000Z"
}
```

---

### PATCH /api/charge-points/:id

Charge point günceller (name, isActive).

**Body:** `name` (string, opsiyonel), `isActive` (boolean, opsiyonel)

```bash
curl -s -X PATCH http://localhost:4000/api/charge-points/CP_UUID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{"name":"İstasyon A - Yeni Ad","isActive":true}'
```

---

### DELETE /api/charge-points/:id

Charge point kaydını siler.

```bash
curl -s -X DELETE http://localhost:4000/api/charge-points/CP_UUID \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Örnek yanıt:**
```json
{"id":"uuid","chargePointId":"CP001"}
```

---

## Hata yanıtları

| HTTP | Açıklama |
|------|----------|
| 400 | Validation failed (body/param hatası) |
| 401 | Authentication required / Invalid or expired token |
| 403 | Insufficient permissions |
| 404 | User / Tenant / Charge point not found |
| 409 | Email already in use / Charge point id already in use |
| 500 | Internal server error |

Validation hatalarında yanıt örneği:

```json
{
  "error": "Validation failed",
  "details": [
    {"field": "email", "message": "Invalid email address"},
    {"field": "password", "message": "Password must be at least 8 characters"}
  ]
}
```

---

## Özet tablo

| Method | Endpoint | Auth | Rol |
|--------|----------|------|-----|
| GET | /api/health | Hayır | - |
| POST | /api/auth/login | Hayır | - |
| POST | /api/auth/refresh | Hayır | - |
| POST | /api/auth/logout | Evet | - |
| GET | /api/auth/me | Evet | - |
| GET | /api/tenants | Evet | super_admin |
| GET | /api/tenants/:id | Evet | super_admin |
| POST | /api/tenants | Evet | super_admin |
| PATCH | /api/tenants/:id | Evet | super_admin |
| DELETE | /api/tenants/:id | Evet | super_admin |
| GET | /api/users | Evet | super_admin, admin |
| GET | /api/users/:id | Evet | ownership / tenant |
| POST | /api/users | Evet | super_admin, admin |
| PATCH | /api/users/:id | Evet | ownership / tenant |
| DELETE | /api/users/:id | Evet | super_admin, admin |
| GET | /api/charge-points | Evet | super_admin, admin |
| GET | /api/charge-points/:id | Evet | super_admin, admin |
| POST | /api/charge-points | Evet | super_admin, admin |
| PATCH | /api/charge-points/:id | Evet | super_admin, admin |
| DELETE | /api/charge-points/:id | Evet | super_admin, admin |
