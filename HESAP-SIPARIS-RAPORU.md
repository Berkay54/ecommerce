# Müşteri hesabı ve sipariş akışı

Güncellik notu: Bu önceki aşamanın raporudur. Sonraki sandbox ödeme aşaması stok düşümünü doğrulanmış ödeme sonrasına taşıdı ve manuel PAID atamasını kapattı. Güncel checkout, ödeme ve stok davranışı için [iyzico Sandbox Raporu](./IYZICO-SANDBOX-RAPORU.md) geçerlidir.

Doğrulama tarihi: 1 Kasım 2026. Mevcut Türkçe storefront, ürün editörü, sepet ve tasarım korunarak eklendi. Next.js 16.4.3 ve Prisma 7.10.1 korundu; Prisma bağlantı/config ayarları bu aşamada değiştirilmedi.

## 1. Değiştirilen dosyalar

Bu aşamanın dosyaları aşağıdadır; çalışma ağacında önceki aşamalardan kalan değişiklikler de vardır.

- Auth: `src/auth.ts`, `src/types/next-auth.d.ts`, `src/lib/password.ts`, `src/lib/auth-rate-limit.ts`, `src/lib/auth-user.ts`, `src/app/auth-actions.ts`, `src/app/api/auth/[...nextauth]/route.ts`.
- Hesap: `src/app/(store)/giris/page.tsx`, `kayit/page.tsx`, `hesabim/layout.tsx`, `hesabim/page.tsx`, `hesabim/adresler/page.tsx`, `hesabim/siparisler/page.tsx`, `src/app/account-actions.ts`.
- Sipariş: `src/lib/order-service.ts`, `src/lib/order-display.ts`, `src/app/order-actions.ts`, `src/app/(store)/checkout/page.tsx`, `src/app/(store)/orders/[orderNumber]/page.tsx`.
- Bileşenler: `src/components/auth-form.tsx`, `account-menu.tsx`, `address-form.tsx`, `checkout.tsx`, `order-details.tsx`, `order-status-form.tsx`; mevcut `catalog.tsx`, `store-actions.tsx`, `cart.tsx`, `cart-provider.tsx` entegrasyonları.
- Admin: `src/app/admin/layout.tsx`, mevcut admin sayfaları ve `actions.ts`, `src/app/admin/orders/page.tsx`, `src/app/admin/orders/[id]/page.tsx`, `src/app/api/admin/images/route.ts`.
- Diğer: `src/app/globals.css`, `src/app/(store)/bilgi/[slug]/page.tsx`, `prisma/schema.prisma`, `prisma/migrations/20261101010000_customer_orders/migration.sql`, `package.json`, `package-lock.json`, `scripts/promote-admin.cjs`, `tests/customer-orders.spec.ts`, `tests/auth-helpers.ts`, `tests/database-read.ts`, mevcut image/storefront testleri, `README.md`, bu rapor.

## 2. Minimum schema değişiklikleri

Mevcut User, Address, Order ve OrderItem modelleri kullanıldı. Eklenenler:

- `Address.deletedAt`: adres silindiğinde kullanıcı listesinden kaldırır; geçmiş siparişin adres ilişkisini korur.
- `Order.shippingAddress`: sipariş anındaki teslimat adresinin JSON kopyası. Adresin sonradan düzenlenmesi geçmiş siparişi değiştirmez.
- `OrderItem.productName` ve `variantName`: sipariş anındaki isimleri korur.
- `AuthRateLimit`: giriş/kayıt deneme limitlerini Vercel örnekleri arasında ortak veritabanında tutar. Anahtarlar hash edilir.

Yeni alanlar mevcut kayıtlarla uyumludur; eski siparişlerde ilişkili kayıtlara fallback vardır. Yalnızca ekleme yapan migration mevcut yerel veritabanına uygulandı. Migrations silinmedi; reset, drop veya veri silme komutu çalıştırılmadı.

Diğer ortamlarda deployment öncesi:

```powershell
npx.cmd prisma migrate deploy --config prisma7.config.ts
npm.cmd run db:generate
```

## 3. Auth yöntemi ve kurulum

Auth.js / NextAuth `5.0.0-beta.32` Credentials kullanıldı. Bu sürüm ön sürümdür; kilit dosyası kurulan sürümü sabitler. Mevcut User modeli kullanılır; yeni kayıt daima USER olur. Parolalar rastgele salt ve Node.js scrypt ile hash edilir; düz metin parola kabul edilmez. Oturum 7 günlük, Auth.js tarafından yönetilen şifreli JWT cookie kullanır. Giriş/kayıt denemeleri 15 dakikalık pencerede sınırlandırılır.

`/giris`, `/kayit`, `/hesabim` ve header gerçek oturum durumuna bağlandı. Yetki gerektiren her sunucu işlemi kullanıcıyı veritabanından tekrar okur. ADMIN koruması sayfalarda, mutation action'larında ve görsel API'sinde uygulanır. Next.js Cache Components uyumu için oturum okuma istek zamanında, Suspense altında yapılır.

Bu PC'de rastgele `AUTH_SECRET` yoksa ignored `.env.local` içine üretildi; dosya repoya alınmaz. Vercel'de güçlü ve kalıcı `AUTH_SECRET` environment variable tanımlayın. Secret'ı `NEXT_PUBLIC_` ile yayınlamayın. Blob için önceki README kurulum adımları geçerlidir.

Hiçbir kullanıcı veya admin otomatik oluşturulmadı. Gerçek kullanıcı `/kayit` üzerinden kayıt olduktan sonra ilk yönetici rolü yalnızca yerel/operatör komutuyla verilebilir:

```powershell
npm.cmd run admin:promote -- gercek-kullanicinin-epostasi
```

Komut yalnızca mevcut kullanıcıyı ADMIN yapar; yeni kullanıcı oluşturmaz. Bu çalışma sırasında çalıştırılmadı.

## 4. Checkout

`/cart` → oturum gerekiyorsa `/giris` → `/checkout`. Kullanıcı kendi adreslerinden seçim yapar; `/hesabim/adresler` üzerinden birden fazla adres ekler, düzenler veya siler. Checkout'ta teslimat adresi, sipariş özeti ve ödeme açıklaması bulunur:

> Ödeme entegrasyonu sonraki aşamada bağlanacaktır.

Kart bilgisi istenmez, ödeme alınmaz ve sahte ödeme başarılı sonucu üretilmez. Gösterilen toplam ürün bedelidir; kargo ücreti hesaplanmaz. Mevcut localStorage misafir sepeti korunur; giriş sonrasında aynı tarayıcıdaki sepet kullanılır.

## 5. Sipariş

Sunucu ürünün aktifliğini, varyantın ürüne ait olduğunu, güncel fiyat ve stoğu yeniden doğrular. Client fiyatı kullanılmaz. Toplam Decimal ile hesaplanır; sipariş ve koşullu stok düşümü aynı Serializable transaction içinde yapılır. Çakışmalar sınırlı olarak yeniden denenir; stok eksiye düşmez.

Başlangıç durumu PENDING; numara İstanbul tarihine göre `SIP-YYYYMMDD-12345678` biçimindedir. Tekrar gönderilen aynı isteğin ikinci sipariş/stok düşümü üretmesini engellemek için kullanıcıya bağlı istek anahtarı mevcut Order.id alanında kullanılır. Başarıdan sonra sepet temizlenir ve `/orders/[orderNumber]` açılır. `/hesabim/siparisler` yalnızca o kullanıcının siparişlerini listeler; detay sorgusu da kullanıcı ID'siyle sınırlandırılır.

## 6. Admin sipariş yönetimi

`/admin/orders` tüm siparişleri sayfalı listeler. Detayda kullanıcı, teslimat adresi, ürünler, fiyat/toplam ve durum bulunur. Durumlar Türkçe gösterilir. Sunucu geçişleri sınırlar; iptal stokları transaction içinde bir kez iade eder, iptal/teslim edilmiş siparişler yeniden açılmaz. “Ödendi” seçeneği açıkça manuel yönetici kaydıdır; ödeme sağlayıcısına bağlanmaz.

## 7. Doğrulama ve kalan işler

- `npm.cmd run typecheck`: başarılı.
- `npm.cmd run lint`: 0 hata; önceden var olan `prisma7.config.ts` içindeki kullanılmayan `env` importu için 1 uyarı. Kullanıcının config'i korunmuştur.
- `npm.cmd run build`: başarılı, Next.js 16.4.3 / Prisma 7.10.1.
- `npm.cmd run test:e2e`: Chromium'da **14 geçti, 10 skipped**. Misafir hesap/checkout/sipariş/admin erişim korumaları, görsel API 401 yanıtları, parola hash doğrulaması, kullanıcı oluşturmayan kayıt doğrulaması, hatalı giriş, sepet hata/persistence kontrolleri ve mobil/masaüstü taşma kontrolleri geçti. Giriş/kayıt ekran görüntüleri ayrıca incelendi.
- Gerçek hesap, ADMIN, ürün, adres ve Blob token bulunmadığı için başarılı kayıt/giriş/çıkış, adres CRUD, dolu sepet, checkout/sipariş oluşturma, stok düşümü, kullanıcılar arası yetki ve yetkili admin/görsel akışları uçtan uca doğrulanamadı. Kullanıcının talimatıyla test hesabı, ürün veya sipariş oluşturulmadı. Bu akışlar için koşullu testler hazırdır; skipped testler başarılı sayılmaz.
- Yerel `ecommerce-home` Prisma servisi bağlantı kesintisi sonrasında veri korunarak yeniden başlatıldı. Schema/config/bağlantı ayarları değiştirilmedi.

Gerçek veriyle test için ignored `.env.local` içinde `E2E_EMAIL`, `E2E_PASSWORD`, gerekiyorsa `E2E_ADMIN_EMAIL`, `E2E_ADMIN_PASSWORD`, `E2E_PRODUCT_SLUG` kullanılabilir. Sipariş testi gerçek stok düşürdüğünden ayrıca `E2E_ALLOW_ORDER_CREATION=1` gerekir; adres CRUD testi yalnızca kullanıcı tarafından sağlanan `E2E_ADDRESS_JSON` ile çalışır. Parolaları sohbete veya repoya eklemeyin.

iyzico/Stripe, kargo API, e-fatura, newsletter, gerçek kupon, sosyal giriş eklenmedi. E-posta doğrulama ve parola sıfırlama bu kapsamda uygulanmadı. Yasal metinler ve ödeme/kargo entegrasyonları ayrı aşamada tamamlanmalıdır.
