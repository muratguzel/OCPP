## V1

- user' lara numarataj field' ı eklenecek. Her bir user admin veya super admin tarafından yaratılırken yeni user yaratma formunda numarataj field' ı olacak ve bu doldurulacak.
- birden fazla farklı user' lar aynı numarataja sahip olabilir.
- her bir user' ın cep numarası da kayıt sırasında alınacak. cep numarası unique olacak.
- user kendi şifresini değiştirebilir bir mekanizmaya sahip olacak.
- şarj istasyonunda QR kod okutarak şarj işlemine başlanacak. Bunun için QR kodu oluşturma bölümü olacak. QR kod oluşturma ekranı sadece ve sadece super admin tarafından yapılacak.
- QR kod içeriğinde şarj istasyonun id' si ve ismi olacak. **önemli**: bu id ve isim; user' ın bağlı olduğu tenant bilgisinin charge points tablosundaki charge point id ve name' dir. Bu kontrol yapılması gerekiyor.
- Admin panelinde kendi tenant bilgisi dahilinde tüm charge point' ler için bir kWh fiyatı belirleyecek. **Sistemde tek bir fiyat olmayacak.** **Her admin kendi fiyatını belirleyecek.**
- Admin panelinde fiyatla birlikte KDV oranı da belirleyecek. Eğer admin elektriği satmıyorsa ama belli bir fiyat üzerinden kullanıdıryorsa KDV oranını 0 olarak belirleyecek. Eğer admin elektriği satıyorsa KDV oranını kendisi belirleyecek.
- Admin kendi tenant içinde transaction bazlı ödeme almayacak. Ödeme transaction bazında kaydedilecek sonra admin belli bir period filtrelemesi ile ne kadar ödeme alacağını görüntüleyecek.
- Filtrelem işlemini kullanıcı bazında ya da numarataj bazında yapabilecek. Bu tutar tarihlerle birlikte fiş formatında PDF olarak indirilebilecek.
- User' ların mobil uygulamada şimdiye kadar ne kadar kullandıklarını görüntleceyceği bir ekran olacak. Bu ekran sadece ve sadece kendi numaratajına ve kullanıcı bilgisine göre görüntülenecek.
- Admin kendisi bir charge point ekleyemez. Şu anda eklenir gibi bir durumda bu iptal edilecek, kaldırılacak.
- Super Admin tüm charge point' leri yönetebilecek. Yeni bir charge point oluşturduğunda yaratılma tarihi de mutlaka olacak.

## V2

- transaction' ların kapanma sorunu var. transaction' lar oluşturulduğunda bazen kapanıyor bazen kapanmıyor. Nedenini araştırıp fix edecek.

- User login ise aynı aynda tekrardan farklı bir telefon ile login olmaması gerekiyor. **Bu konu önemli.**
- Socket aktif ise charging statusunde ise başka bir kullanıcı QR kodu okuttuğunda ekrana liste çıkıp şarjı başlat yerine listenin çıkmadan "Şarj İstasyonu Dolu" diye bir mesaj çıkacak. Bu konu fix edilecek.
- Şarj olurken ekrandaki fiyat oluşturulan fiyata göre değil tahmini bir fiyata göre çalışıyor bu konu fix edilecek.
