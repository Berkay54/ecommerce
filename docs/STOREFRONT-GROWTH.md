# Özen · Mağaza geliştirmeleri

## Kullanım

- Ürün detayı: **Görseli büyüt**, yakınlaştırma, klavye ile görsel geçişi, beden rehberi, kumaş/bakım açıklaması ve mobil satın alma alanı eklendi. Beden rehberi doğrulanmamış santimetre değerleri üretmez; gerçek kumaş/bakım ve kalıp bilgisini ürün açıklamasına yazın.
- Header araması: iki karakterden sonra ürün/kategori önerileri; ok tuşları, Enter, Escape ve normal arama desteği. Yükleme başarısız olsa da normal arama çalışır.
- `/admin/campaigns`: başlangıç slaytlarını panele aktarın veya yeni kampanya oluşturun. Metin, görsel, alternatif metin, mağaza içi bağlantı, tema, yayın durumu ve sıra düzenlenebilir. İlk altı aktif slayt gösterilir. Tüm kayıtlar pasifse slayt alanı gizlenir. Veritabanında kampanya yoksa mevcut başlangıç vitrini kullanılır. Kayıt silmek yerine pasife alınır.
- Kampanya görselleri mevcut admin Blob yükleyicisini kullanır. Tek görsel yükleyin; kaydederken görsel otomatik seçilir. URL veya mevcut yerel `/campaigns/*.webp` varlıkları da kullanılabilir. Ürün görseliyle paylaşılan Blob dosyaları referansı varken silinmez. Değiştirilen kampanya varlıkları güvenli tarafta kalmak için otomatik silinmez; Blob panelinden kullanılmayan dosyaları denetleyin.
- Admin sipariş detayı: Hazırlanıyor aşamasında kargo firması ve takip numarası kaydedilir. Kargoya Verildi durumuna geçmek için bu alanlar zorunludur. Müşteri sipariş detayında takip numarasını görür; taşıyıcı API bağlantısı yoktur.
- Teslim edilmiş siparişte müşteri siparişin tamamı için bir iade talebi açabilir. `/admin/returns` ve sipariş detayında yönetilir. Müşteriye açıklama zorunludur. Talep, mağazanın incelemesini başlatır; otomatik kabul, yasal süre kararı, para iadesi veya stok hareketi oluşturmaz. Kısmi iade ve ödeme sağlayıcısı iade API'si bu aşamada yoktur. Talebi kapatmadan önce ödeme/stok mutabakatını işletme ayrıca yapmalıdır.
- Müşteri yalnızca kendisine ait ödenmiş/hazırlanan/kargolanan/teslim edilmiş siparişteki ürünü değerlendirebilir. Ürün başına bir yorum vardır. Düzenleme onayı kaldırır. `/admin/reviews` üzerinden yayımlanır/gizlenir. Müşterinin e-posta adresi vitrinde yayımlanmaz. Vitrin en yeni 30 onaylı yorumu ve tüm onaylı yorumların ortalamasını gösterir.

## Veritabanı

Prisma **7.10.1** ve `prisma7.config.ts` korunur. `20261101030000_storefront_growth` yalnızca eklemeler içerir:

- `Campaign`: admin tarafından düzenlenebilir vitrin slaytları.
- `Order.shippingCarrier`, `Order.trackingNumber`: kargo bilgileri.
- `ReturnRequest`: siparişe bağlı tek iade talebi ve durumu.
- `Review.approved`: onaysız içerik yayımlanmasın diye varsayılan `false`; mevcut yorumlar da onay bekler.
- `OrderNotification`: siparişten bağımsız yeniden deneme için kalıcı e-posta kuyruğu.

Diğer PC ve dağıtım ortamında, sunucuyu açmadan önce:

```powershell
npm.cmd ci
npx.cmd prisma migrate deploy --config prisma7.config.ts
npm.cmd run db:generate
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run build
```

Veri sıfırlama, migration silme veya `db push` gerekmez.

## Sipariş e-postaları / Resend

Gerçek gönderim **varsayılan kapalıdır**; bu geliştirmelerin testinde gerçek müşteriye e-posta gönderilmez. Alan adınızı Resend üzerinde doğrulayın ve Vercel ortam değişkenlerini ekleyin:

```dotenv
RESEND_API_KEY=gercek-api-anahtari
ORDER_EMAIL_FROM=Özen <siparis@alan-adiniz.com>
ORDER_EMAILS_ENABLED=true
CRON_SECRET=uzun-rastgele-bir-deger
NEXT_PUBLIC_APP_URL=https://alan-adiniz.com
```

Anahtarları Git'e eklemeyin. `ORDER_EMAIL_FROM` doğrulanmış alan adından olmalı. Sağlayıcının [e-posta gönderim API'si](https://resend.com/docs/api-reference/emails/send-email) doğrudan sunucudan çağrılır; ek istemci SDK'sı gerekmez.

Sipariş oluşması, doğrulanmış ödeme, durum/kargo güncellemesi ve iade olayları aynı veritabanı transaction'ında kuyruğa girer. Sipariş/ödeme yanıtından sonra Next.js `after` ile gönderim denenir. Sağlayıcı hatası başarılı siparişi geri almaz. `/admin/notifications` sağlayıcıya iletimi gösterir; bu, gelen kutusuna teslim onayı değildir.

Başarısız denemeler için zamanlayıcıyı **ayrıca** kurun: `GET /api/cron/notifications`, `Authorization: Bearer <CRON_SECRET>`. En az birkaç dakikada bir çalıştırın; platform planınızın zamanlayıcı sınırlarını kontrol edin. Endpoint her çağrıda en fazla beş kayıt işler. Admin'deki yeniden deneme düğmesi de aynı kuyruğu kullanır. Gönderim kapalıyken kayıtlar bekler.

İstekler sabit içerik/gönderen ve olay bazında tekil idempotency anahtarı kullanır. [Resend anahtarları 24 saat saklar](https://resend.com/docs/dashboard/emails/idempotency-keys); ilk denemesi 23 saati geçen belirsiz kayıtlar otomatik gönderilmez ve **Manuel inceleme gerekiyor** durumuna alınır. Bu kayıtlar sağlayıcı paneliyle mutabakat gerektirir. Sağlayıcı hatası e-posta adresleri/anahtarlar yazdırılmadan kaydedilir.

## Yayına hazırlık

`/admin/readiness` yapılandırma ve katalog eksiklerini listeler. Bu ekran harici servislerin sağlığını veya DNS doğrulamasını kanıtlamaz.

1. HTTPS alan adı ve kalıcı `AUTH_SECRET`; doğru Supabase bağlantısı ve uygulanmış migration'lar.
2. Vercel Blob mağazası + `BLOB_READ_WRITE_TOKEN`; gerçek ürünle eşleşen fotoğraflar.
3. Demo ürünleri admin panelinden pasif yapın; gerçek fiyat, stok, SKU ve ürün açıklamalarını girin.
4. Firma/iletişim bilgileri ve işletmeye uygun satış, gizlilik ve iade içeriklerini tamamlayın.
5. E-posta alan adı ve zamanlayıcıyı yapılandırın; kontrollü bir gerçek hesapla gönderimi doğrulayın.
6. Gerçek katalog hazır olduğunda `STORE_PUBLIC_INDEXING=true` ile yeniden build/deploy edin. Domain ayarı HTTPS değilse indeksleme açılmaz. Demo ürünler sitemap'e alınmaz ve ürün sayfaları `noindex` kalır. Ürün metadata'sı ve güvenli JSON-LD gerçek ürünlerde hazırlanır.
7. iyzico bu projede **sandbox** ile sınırlıdır. Canlı ödeme, kargo API'si ve otomatik geri ödeme ayrıca ele alınmalıdır. Bu adımlar tamamlanmadan gerçek satışa hazır kabul etmeyin.

## Doğrulama

`npm.cmd run test:e2e` mevcut testleri ve yeni `tests/storefront-growth.spec.ts` kontrollerini çalıştırır. Yeni kontroller: arama/API ve hata koşulları, görsel büyütme, beden rehberi, mobil satın alma, responsive taşma, kampanya/kargo doğrulaması, yorum görünürlüğü ve yönetim erişim koruması.

Mevcut gerçek hesap bilgileri ortamda yoksa giriş gerektiren testler atlanır. Sahte kullanıcı, yorum veya sipariş oluşturulmaz; gerçek gönderim ve gerçek ödeme yapılmaz. Testler demo katalogdaki gerçek DB kayıtlarıyla sepeti yalnızca tarayıcıda kullanır; stok/sipariş verisini değiştirmez.

Bu PC'deki son çalıştırma: **30 başarılı, 11 atlanan** test. TypeScript, ESLint ve production build geçti; `prisma7.config.ts` içindeki önceden mevcut kullanılmayan `env` import uyarısı korunur. Migration uygulandı ve Prisma schema doğrulandı. Ürün detayı ve slaytlar 375/768/1440 px boyutlarında kontrol edildi.

Gerçek müşteri/admin giriş bilgileri, tamamlanmış gerçek sandbox siparişi ve Blob bağlantısı olmadığı için oturum gerektiren kampanya kaydetme, kargo/iade durum değişimi ve yorum onayı tarayıcıda uçtan uca doğrulanamadı. E-posta sağlayıcısı/alan adı kurulmadığı için teslim testi yapılmadı. Bu işlemler ilk kontrollü gerçek hesap/siparişle ayrıca doğrulanmalıdır; erişim korumaları, doğrulama kuralları ve halka açık akışlar test edildi.
