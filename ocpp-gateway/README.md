# OCPP Gateway

Şarj Modül projesi için OCPP Central System (CSMS). Şarj istasyonları WebSocket üzerinden OCPP 1.6J, 2.0.1 ve 2.1 ile bu gateway'e bağlanır.

## Tech Stack

- Node.js, TypeScript
- Express (HTTP: health endpoint)
- ocpp-rpc (OCPP WebSocket server)

## Kurulum

```bash
npm install
cp .env.example .env
```

Not: `ocpp-rpc` içindeki şema doğrulayıcı (ajv 8.17+) URN hatası verdiği için `package.json` içinde `ajv@8.16.0` override kullanılıyor. Gerekirse ileride kaldırılabilir.

## Ortam Değişkenleri

| Değişken    | Açıklama              | Varsayılan |
|------------|------------------------|------------|
| PORT       | HTTP sunucu portu      | 3000       |
| OCPP_PORT  | OCPP WebSocket portu   | 9220       |

## Çalıştırma

```bash
# Geliştirme (tsx ile)
npm run dev

# Build + production
npm run build
npm start
```

## Test

- HTTP health: `curl http://localhost:3000/health`
- OCPP WebSocket: Charge point bağlantı URL örneği: `ws://localhost:9220/CP_001` (CP_001 yerine kendi istasyon kimliğinizi kullanın; ocpp-rpc path yapısına göre gerekirse `ws://localhost:9220` olabilir).

## HTTP API (CP'ye komut gönderme)

Bağlı bir şarj istasyonuna uzaktan komut göndermek için:

| Method | Endpoint        | Açıklama                    |
|--------|-----------------|-----------------------------|
| GET    | /charge-points  | Bağlı istasyon listesi      |
| POST   | /remote-start   | Şarj başlat (idTag, connectorId?) |
| POST   | /remote-stop    | Şarj durdur (transactionId) |
| GET    | /charge-points/:id/transactions | İstasyonun transaction listesi |
| GET    | /charge-points/:id/transactions/:txId/meters | Transaction meter değerleri (polling) |
| POST   | /charge-points/:id/trigger-meter | CP'den anlık MeterValues tetikle |

**Örnek – Bağlı istasyonları listele:**
```bash
curl http://localhost:3000/charge-points
```

**Örnek – Şarj başlat:**
```bash
curl -X POST http://localhost:3000/remote-start \
  -H "Content-Type: application/json" \
  -d '{"chargePointId":"CP_001","idTag":"USER_RFID_123","connectorId":1}'
```

**Örnek – Şarj durdur:**
```bash
curl -X POST http://localhost:3000/remote-stop \
  -H "Content-Type: application/json" \
  -d '{"chargePointId":"CP_001","transactionId":42}'
```

Gateway, CP'nin protokolüne göre otomatik olarak **OCPP 1.6** (RemoteStartTransaction / RemoteStopTransaction) veya **OCPP 2.x** (RequestStartTransaction / RequestStopTransaction) kullanır.

### Meter (metrik) endpoint'leri

StartTransaction sonrasında şarj sırasında metrik almak için:

1. **Transaction listesi** – Hangi transaction'ların olduğunu ve `transactionId` almak için:
   ```bash
   curl http://localhost:3000/charge-points/CP001/transactions
   ```

2. **Meter değerleri (polling)** – Belirli bir transaction için, düzenli aralıklarla (örn. her 10–30 saniye) çağrılabilir:
   ```bash
   # Tüm meter değerleri
   curl "http://localhost:3000/charge-points/CP001/transactions/42/meters"
   # Son 50 kayıt
   curl "http://localhost:3000/charge-points/CP001/transactions/42/meters?limit=50"
   # Belirli zamandan sonrakiler (artımlı senkron için)
   curl "http://localhost:3000/charge-points/CP001/transactions/42/meters?since=2025-02-06T12:00:00Z"
   ```

3. **Anlık meter tetikleme** – CP'ye TriggerMessage ile “şimdi MeterValues gönder” demek için (CP gönderince GET .../meters ile okunur):
   ```bash
   curl -X POST http://localhost:3000/charge-points/CP001/trigger-meter \
     -H "Content-Type: application/json" \
     -d '{"connectorId":1}'
   ```

CP, StartTransaction/MeterValues ile periyodik olarak zaten değer gönderebilir; bu durumda sadece GET .../meters ile belirli bir interval'de (örn. 15 saniyede bir) poll etmeniz yeterlidir.

### "Charge point not connected" hatası

`chargePointId` değeri, şarj istasyonunun **WebSocket bağlantı URL'indeki son path segmenti** ile birebir aynı olmalıdır:

- Doğru: `ws://localhost:9220/CP001` → API'de `chargePointId: "CP001"` kullanın.
- Yanlış: `ws://localhost:9220/` (path yok) veya `ws://localhost:9220/CP001/` (sonda slash) → identity boş veya yanlış olur.

**Yapmanız gerekenler:**
1. Şarj istasyonunu **`ws://<gateway-host>:9220/CP001`** gibi bir URL ile bağlayın (sonda `/` olmasın).
2. Bağlı kimlikleri görmek için: `curl http://localhost:3000/charge-points` — buradaki `chargePointId` değerlerini `/remote-start` ve `/remote-stop` isteklerinde aynen kullanın.
3. `/remote-start` 404 dönerse cevaptaki `connectedChargePointIds` alanına bakın; boşsa CP hiç bağlı değildir, doluysa listedeki bir ID ile deneyin.

## Desteklenen OCPP Mesajları

- **CP → CSMS:** BootNotification, Heartbeat, StatusNotification, Authorize, StartTransaction, StopTransaction, TransactionEvent (2.x), MeterValues
- **CSMS → CP:** RemoteStartTransaction / RequestStartTransaction, RemoteStopTransaction / RequestStopTransaction (HTTP API üzerinden)
