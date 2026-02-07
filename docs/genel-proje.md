ben sana projemi anlatayım sen buradan bana cursor için rule oluşturmasını, skill ve ne yapmam gerektiğini best practices için ve ayrıca kesinlikle ve kesinlikle az token tüketmesi için gerekli dosyaları hazırla

Proje: Şarj Modül - Araç şarj istasyonu yönetim paneli

# User Stories

Sistemde bir super admin bulunur. Super admin, yeni bir admin oluşturmayı ve adminlerin şarj istasyonlarını yönetmesini sağlar.

Adminler, şarj istasyonlarını kullanacak kullanıcıları yönetir. Yeni kullanıcı açılması, kullanıcı silme, kullanıcının şarj istasyonlarını yönetmesi, kullanıcının şarj istasyonlarını kullanması gibi işlemleri yapabilir.

Kullanıcılar, mobil uygulama ile şarj istasyonlarında bulunan QR kodu okuyarak şarj işlemini başlatır. Şarj işlemini bitirdikten sonra sistem; ne kadar kullandığı, kaç kW enerji tükettiği ve bunun fiyatını hesaplayarak kaydeder. Admin, belli zamanlarda kullanıcıların şarj istasyonlarında ne kadar kullandığını görüntüleyebilir.

# Apps Stack

1. Admin Web Panel — Super Admin ve Admin'lerin kullandığı dashboard. İstasyon yönetimi, kullanıcı yönetimi, raporlama ve faturalandırma burada yapılır.

2. Mobil Uygulama (Son Kullanıcı) — QR kod okuma, şarj başlatma/durdurma, şarj geçmişi ve anlık şarj durumu takibi. iOS ve Android için tek codebase.

3. Backend API Server — Tüm iş mantığının yaşadığı merkez. REST API, kullanıcı yönetimi, faturalandırma, raporlama.

4. OCPP Gateway (Central System) — Şarj istasyonlarıyla doğrudan WebSocket üzerinden OCPP protokolüyle konuşan ayrı bir servis. Bu, backend'den ayrı olmalı çünkü OCPP sürekli açık WebSocket bağlantıları gerektirir ve farklı bir ölçekleme profili vardır.

## Admin Web Panel Tech Stack

1. React
2. Tailwind CSS
3. TypeScript
4. React Router
5. Shadcn/ui

## Mobil Uygulama Tech Stack

1. React Native
2. React Native Camera
3. TypeScript
4. Expo

## Backend API Server Tech Stack

1. Node.js
2. TypeScript
3. Express.js
4. PostgreSQL
5. Redis

## OCPP Gateway Tech Stack

1. Node.js
2. TypeScript
3. Express.js
4. ocpp-rpc
5. OCPP 1.6J
6. OCPP 2.0.1
7. OCPP 2.1

## Authentication

1. JWT
2. Role-based access control: Super Admin -> Admin -> User
