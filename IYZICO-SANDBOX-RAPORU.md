# iyzico sandbox entegrasyonu

1 Kasım 2026. Mevcut hesap, adres, sepet, checkout, sipariş ve admin yapısına eklendi. Next.js **16.4.3**, Prisma/Client **7.10.1**, Auth.js **5.0.0-beta.32** korundu. Resmi `iyzipay` **2.0.71** kuruldu. `prisma7.config.ts` ve bağlantı ayarları bu aşamada değiştirilmedi.

## Kurulum

Ignored `.env.local` içine kendi sandbox bilgilerinizle şu değişkenleri ekleyin; örnek isimler `.env.example` içinde bulunur:

```dotenv
IYZIPAY_API_KEY=YOUR_SANDBOX_API_KEY
IYZIPAY_SECRET_KEY=YOUR_SANDBOX_SECRET_KEY
IYZIPAY_URI=https://sandbox-api.iyzipay.com
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Gerçek anahtar yazılmadı veya üretilmedi. Anahtarlar server-only SDK katmanında kullanılır. Üretim API adresi kod tarafından reddedilir. Yerel dışındaki uygulama adresi HTTPS olmalıdır. iyzico callback için geçerli SSL ister; gerçek sandbox testi sırasında erişilebilir HTTPS uygulama/tünel adresini `NEXT_PUBLIC_APP_URL` yapın. Port/adres çalışan uygulamayla aynı olmalı; environment değiştikten sonra sunucuyu yeniden başlatın. Bu değişken client tarafından Host header'ından türetilmez.

Diğer ortamlarda önce eklemeli migrationı uygulayın:

```powershell
npm.cmd install
npx.cmd prisma migrate deploy --config prisma7.config.ts
npm.cmd run db:generate
npm.cmd run dev
```

## Akış

1. Giriş yapan kullanıcı `/checkout` üzerinde kendi adresini seçer. Kimlik numarası bu aşamada istenir; sahte bilgiyle doldurulmaz. Alıcının adı/soyadı hesap adından, e-posta User kaydından, cep telefonu ve adres seçilen gerçek Address kaydından alınır. Tek kelimelik hesap adı veya geçersiz cep telefonu kabul edilmez. Türkiye odaklı mevcut adres, fatura adresi olarak da kullanılır. IP isteğin proxy bilgisinden; yerel geliştirmede yoksa loopback adresinden alınır.
2. Sunucu cart ID/adetlerini doğrular; aktif ürün, geçerli varyant, fiyat ve stok veritabanından okunur. Decimal toplam hesaplanır. PENDING Order ve ona bağlı PaymentAttempt oluşturulur. İstemcinin fiyatı kullanılmaz; bu adım stok düşürmez ve sepeti temizlemez. Henüz SDK başlatılmamış eski bir istek tekrar kullanıldığında güncel fiyat/stok yeniden kontrol edilir.
3. “Ödemeye Geç”, SDK CheckoutForm initialize çağrısını yapar. TR, TRY, conversationId, basketId, sunucu toplamı, buyer, adresler ve satırlar iletilir. Satır tutarı birim fiyat × adettir. Tek çekim kullanılır. Başlatma yanıtının HMAC imzası doğrulanır; yalnızca `https://sandbox-cpp.iyzipay.com` üzerindeki hosted `paymentPageUrl` açılır. Bu resmi Checkout Form akışıdır; uygulamaya kart formu HTML/script'i enjekte edilmez.
4. iyzico `/api/payments/iyzico/callback` adresine token POST eder. Callback oturum cookie'sine bağımlı değildir; yalnızca token kullanılarak SDK retrieve çağrısı yapılır. Tarayıcının status/tutar alanları yok sayılır. İmza, token, conversationId, basket/order, TRY ve sipariş tutarı doğrulanır. Başarılı tahsilatta hem price hem paidPrice tam eşleşmelidir; risk onayı da aranır.
5. Başarılı sonuçta Serializable transaction içinde stok tekrar kontrol edilir ve koşullu azaltılır; Order PAID olur. Aynı transaction PaymentAttempt'ı SUCCEEDED yapar. Birden çok callback aynı stoğu tekrar düşürmez; token ve paymentId benzersizdir. Aynı başlatma isteği mevcut sipariş/ödeme kaydını kullanır.
6. Başarı sayfası `/odeme/sonuc/[id]` yalnızca sahibi tarafından görülür. İlgili ödeme ile bu tarayıcının checkout istek anahtarı sunucuda eşleştikten sonra guest sepet temizlenir. Eski bir siparişi tekrar açmak başka checkout'a ait sepeti temizlemez. Kayıtlı hesap sepeti varsa sunucu transaction'ında da temizlenir. Tarayıcı storage/ağ engelinde sipariş korunur; client sepet temizliği için sayfa yeniden açılabilir.

## Stok ve belirsiz sonuçlar

Rezervasyon eklenmedi. Stok **yalnızca doğrulanmış ödeme sonrasında** azalır; başarısız veya terk edilmiş ödemeler stok kaybına yol açmaz. Bunun sonucu olarak ödeme sürerken başka sipariş stoğu tüketebilir. Ödeme başarılı olsa bile stok/ürün veya risk kontrolü engellenirse stok transaction'ı rollback edilir, PaymentAttempt **REVIEW** olur, ödeme ID/zamanı korunur ve Order PENDING kalır. Kullanıcıya yeniden ödeme yapmaması, admin'e sevk etmemesi ve iyzico panelinden incelemesi söylenir. Bu durum otomatik iade değildir; iade bu kapsamda yoktur.

SDK/ağ hatası veya imzasız/eksik retrieve yanıtı “ödeme başarısız” kabul edilmez. Durum belirsiz kalır; token varsa kullanıcı sonucu tekrar sorgulayabilir. Başlatma isteği zaman aşımına uğrarsa aynı sipariş için otomatik ikinci initialize çağrısı yapılmaz. Token elde edilememiş belirsiz başlatma kayıtları operatör incelemesi gerektirir. Süresi dolmuş/yarım bırakılmış kayıtları otomatik silen veya iptal eden iş eklenmedi.

İmzayla doğrulanan başarısız ödemede Order PAID olmaz; stok/sepet korunur. Türkçe başarısız sayfasında tekrar dene/sepete dön seçenekleri vardır. Dönen API hatası final ve doğrulanabilir ödeme sonucu değilse güvenlik için bekleme ekranı kullanılır.

## Minimum schema değişikliği

- `Order.inventoryDeducted`: eski siparişlerin önceki stok düşümünü korumak için default true; yeni sandbox siparişlerinde açıkça false. Stok hareketinin durum değişiklikleriyle yanlışlıkla tekrarlanmasını önler.
- `PaymentAttempt`: siparişe bire bir ödeme kaydı; durum, benzersiz token ve paymentId, hosted URL, ödeme zamanı ve inceleme kodu. İlgili satırların yalnızca işlem referansları/tutarları JSON olarak saklanır. Kart numarası, CVC, BIN, kart sahibi veya ham SDK cevabı tutulmaz.
- `20261101020000_iyzico_sandbox` migrationı eklendi ve yerel veritabanına uygulandı. Mevcut migrationlar silinmedi; reset/drop çalıştırılmadı.

Kimlik numarası için User/Address alanı eklenmedi; ödeme isteğinde geçici kullanılır, PostgreSQL'e/loglara yazılmaz. Yeni modelin token/hosted URL alanları ödeme oturumu bilgisi olduğundan yalnızca yetkili sunucu işlemleriyle kullanılır; admin'e secret/token gösterilmez.

## Admin

Mevcut sipariş detayında ödeme durumu, iyzico payment ID ve zamanı gösterilir. Sandbox siparişlerinde onay yalnızca doğrulanmış sonuçtan gelir. Admin action'ı üzerinden PAID atamak tüm siparişlerde engellendi. Doğrulanmış sandbox siparişleri hazırlanıyor/kargoda/teslim edildi durumlarına geçirilebilir; ödeme içeren siparişlerde iptal/iade bu aşamada kapalıdır. Eski siparişlerin mevcut stok ve izin verilen diğer durum davranışları korunur.

## Değiştirilen dosyalar

- `package.json`, `package-lock.json`, `next.config.ts` (SDK'nin dinamik Node require kullanımı için serverExternalPackages).
- `.env.example`, `.gitignore`, `README.md`, önceki hesap raporuna güncellik notu, bu rapor.
- `prisma/schema.prisma`, `prisma/migrations/20261101020000_iyzico_sandbox/migration.sql`.
- `src/types/iyzipay.d.ts`, `src/lib/iyzico.ts`, `src/lib/payment-validation.ts`, `src/lib/payment-service.ts`, `src/lib/order-service.ts`, `src/lib/auth-user.ts`.
- `src/app/order-actions.ts`, `src/app/api/payments/iyzico/callback/route.ts`.
- `src/components/checkout.tsx`, `payment-result.tsx`, `order-details.tsx`, `order-status-form.tsx`.
- `src/app/(store)/checkout/page.tsx`, `odeme/sonuc/[id]/page.tsx`, `odeme/basarisiz/page.tsx`, `orders/[orderNumber]/page.tsx`, `bilgi/[slug]/page.tsx`.
- `src/app/admin/orders/[id]/page.tsx`, `tests/payments.spec.ts`, `tests/customer-orders.spec.ts`.

## Doğrulama

- TypeScript: başarılı.
- ESLint: 0 hata; önceden var olan `prisma7.config.ts` kullanılmayan `env` importu için 1 uyarı. Config korunmuştur.
- Production build: başarılı.
- Tam Playwright paketi: **19 geçti, 12 skipped**. Eksik ödeme ayarı, kesin sandbox URL sınırı, imza/tutar/para birimi/basket/token manipülasyonu, imzalı red/risk kontrolü, callback 503 hata durumu, misafir sonuç sayfası koruması ve mevcut storefront kontrolleri geçti. Mobil ödeme hata ekranı ayrıca görsel olarak incelendi.
- Son hata mesajı düzenlemesinden sonra TypeScript, ESLint ve build yeniden başarılı oldu; ödeme testlerinin ayrı tekrarı **5 geçti, 2 skipped** tamamlandı.
- İlk tam testte yerel Prisma servisinde bağlantı kesildi; aynı ecommerce-home instance'ı veri korunarak yeniden başlatıldı ve paket başarılı tekrarlandı. Bağlantı/config ayarı değiştirilmedi.
- Sandbox anahtarları ve erişilebilir gerçek ürün/oturum bilgileri olmadığından initialize→test kartı→callback→PAID→stok düşümü→sepet temizleme, yinelenen gerçek callback ve gerçek başarısız ödeme **skipped / doğrulanamadı**. Unit imza fixture'ları gerçek iyzico yanıtı veya uçtan uca ödeme testi değildir. Gerçek iyzico yanıt biçimi ve sandbox davranışı anahtarlarla ayrıca doğrulanmalıdır.
- Yeni kullanıcı, ürün, sipariş veya ödeme kaydı oluşturulmadı. Son salt okunur sayım: mevcut kullanıcı 1; ürün, sipariş ve ödeme kaydı 0. Kayıt doğrulama testi kullanıcı sayısının değişmediğini denetler.

Gerçek veri ile koşullu testler için `.env.local`: `E2E_EMAIL`, `E2E_PASSWORD`, `E2E_ALLOW_ORDER_CREATION=1`, `E2E_SANDBOX_IDENTITY_NUMBER`. Gerçek, iyzico tarafında tamamlanmış ve bu uygulamada kayıtlı ödeme için `E2E_SANDBOX_COMPLETED_PAYMENT_TOKEN` veya `E2E_SANDBOX_FAILED_PAYMENT_TOKEN` callback/idempotency testlerini etkinleştirir. Başarılı test gerçek ürün stoğunu düşürür. Bu değerleri sohbete veya repoya eklemeyin. Kart testinde yalnızca iyzico'nun resmi sandbox test kartlarını hosted sayfada kullanın.

## Kapsam dışında

Production iyzico, iade/ödeme iptali, özel taksit arayüzü, kayıtlı kart entegrasyonu, webhook/cron mutabakatı, kargo API ve e-fatura eklenmedi. Ödeme anahtarı/gerçek veri testleri tamamlanmadan bu çalışma canlı ödeme hazırlığı olarak değerlendirilmemelidir.

Resmi kaynaklar: [SDK](https://github.com/iyzico/iyzipay-node), [CF Initialize](https://docs.iyzico.com/en/payment-methods/checkoutform/cf-implementation/cf-initialize), [CF Retrieve](https://docs.iyzico.com/en/payment-methods/checkoutform/cf-implementation/cf-retrieve), [yanıt imzası doğrulama](https://docs.iyzico.com/en/advanced/response-signature-validation).
